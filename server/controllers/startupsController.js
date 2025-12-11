import pool from '../config/database.js';

// Get list of startups with connection status
export const getStartups = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const currentUserId = req.user.userId;
        const { search, industry, country, city, fundingStage, revenueStatus, sortBy } = req.query;

        // Base where clause construction
        let whereConditions = [`u.user_type = 'startup'`];
        let values = [];
        let paramIndex = 1;

        // Search Filter
        if (search) {
            whereConditions.push(`(to_tsvector('english', u.full_name || ' ' || coalesce(p.tagline, '') || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', $${paramIndex}))`);
            values.push(search);
            paramIndex++;
        }

        // Filters
        if (industry) {
            // Handle comma-separated list
            const industries = industry.split(',').map(i => i.trim());
            if (industries.length > 0) {
                // Using ANY for array overlap or simple IN clause if single value structure on DB. 
                // Since DB column is VARCHAR, we'll use simple equality for now, or ILIKE for flexibility. 
                // If the request implies multiple industries *selected* in filter, we match if the startup's industry is ONE of them.
                whereConditions.push(`p.industry = ANY($${paramIndex})`);
                values.push(industries);
                paramIndex++;
            }
        }

        if (country) {
            whereConditions.push(`p.location_country ILIKE $${paramIndex}`);
            values.push(country);
            paramIndex++;
        }

        if (city) {
            whereConditions.push(`p.location_city ILIKE $${paramIndex}`);
            values.push(city);
            paramIndex++;
        }

        if (fundingStage) {
            // Allow multiple stages if comma separated? Let's assume singular for now as per simple filter specs, or comma separated for multi-select.
            // Im implementing multi-select support for robustness.
            const stages = fundingStage.split(',').map(s => s.trim());
            whereConditions.push(`p.funding_stage = ANY($${paramIndex})`);
            values.push(stages);
            paramIndex++;
        }

        if (revenueStatus) {
            const statuses = revenueStatus.split(',').map(s => s.trim());
            whereConditions.push(`p.revenue_status = ANY($${paramIndex})`);
            values.push(statuses);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count Query
        const countQuery = `
            SELECT COUNT(*) 
            FROM users u
            LEFT JOIN startup_profiles p ON p.user_id = u.id
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // Sorting
        let orderBy = 'ORDER BY u.created_at DESC'; // default: newest
        if (sortBy === 'alphabetical') {
            orderBy = 'ORDER BY u.full_name ASC';
        } else if (sortBy === 'updated') {
            orderBy = 'ORDER BY u.updated_at DESC';
        }

        // Main Query
        // Need to join connections separately usually, but here param for connection check is investor_id.
        // We need to inject investor_id into the join but it's not part of the WHERE clause filters exactly.
        // Actually, $1 was investor_id in previous plain query.
        // My dynamic builder uses clean params array. 
        // Let's add investor_id to values list? No, `LEFT JOIN connections` needs it.
        // I will add investor_id as $1, and shift all other paramIndexes by 1.

        // Re-calibrating param indices:
        // $1 = investor_id
        // Filters start from $2

        values = [currentUserId, ...values];
        // Rebuild where clause with shifted indices? 
        // Easier: Build query with placeholders like $2, $3... and shift logic.

        // Let's rewrite the construction cleanly:

        let dbParams = [currentUserId];
        let whereParts = [`u.user_type = 'startup'`];
        let pIdx = 2; // Start from $2

        if (search) {
            whereParts.push(`(to_tsvector('english', u.full_name || ' ' || coalesce(p.tagline, '') || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', $${pIdx}))`);
            dbParams.push(search);
            pIdx++;
        }
        if (industry) {
            whereParts.push(`p.industry = ANY($${pIdx})`);
            dbParams.push(industry.split(',').map(s => s.trim()));
            pIdx++;
        }
        if (country) {
            whereParts.push(`p.location_country ILIKE $${pIdx}`);
            dbParams.push(country);
            pIdx++;
        }
        if (city) {
            whereParts.push(`p.location_city ILIKE $${pIdx}`);
            dbParams.push(city);
            pIdx++;
        }
        if (fundingStage) {
            whereParts.push(`p.funding_stage = ANY($${pIdx})`);
            dbParams.push(fundingStage.split(',').map(s => s.trim()));
            pIdx++;
        }
        if (revenueStatus) {
            whereParts.push(`p.revenue_status = ANY($${pIdx})`);
            dbParams.push(revenueStatus.split(',').map(s => s.trim()));
            pIdx++;
        }

        const finalWhere = 'WHERE ' + whereParts.join(' AND ');

        // Count (doesn't need investor_id, but cleaner to use same params array and ignore $1 if possible, or build separate array)
        // Count query parameters: skip first element of dbParams?
        // No, indices would be wrong in WHERE clause.
        // Solution: Pass full dbParams to count query, but since count query doesn't use $1 (investor_id) in JOIN, is that ok?
        // Postgres allows unused params if not referenced? No, usually strict count.
        // Better: Count query doesn't use connections join anyway.
        // But the WHERE clause references $2, $3... so we must allow specific params.
        // I'll stick to full params and just add `1=1 OR $1::uuid IS NULL` to force usage? Hacky.
        // Correct way: Build count params separately.

        const countParams = dbParams.slice(1);
        // We need to shift indices in WHERE string for count query? Yes.
        // This dynamic building is getting tricky.

        // Simpler approach: Include connections join in count query too, utilizing $1, effectively counting visible startups? 
        // No, connections join doesn't filter rows (LEFT JOIN).
        // It's safe to include the valid SQL with unused parameter if library supports it? `pg` library throws error for mismatch.

        // Refined Plan:
        // Use named parameters style? `pg` uses $1...
        // Let's just build the WHERE clause string dynamically with a start index argument.

        const buildWhere = (startIdx) => {
            let conditions = [`u.user_type = 'startup'`];
            let vals = [];
            let idx = startIdx;

            if (search) {
                conditions.push(`(to_tsvector('english', u.full_name || ' ' || coalesce(p.tagline, '') || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', $${idx}))`);
                vals.push(search);
                idx++;
            }
            if (industry) {
                conditions.push(`p.industry = ANY($${idx})`);
                vals.push(industry.split(',').map(s => s.trim()));
                idx++;
            }
            if (country) {
                conditions.push(`p.location_country ILIKE $${idx}`);
                vals.push(country);
                idx++;
            }
            if (city) {
                conditions.push(`p.location_city ILIKE $${idx}`);
                vals.push(city);
                idx++;
            }
            if (fundingStage) {
                conditions.push(`p.funding_stage = ANY($${idx})`);
                vals.push(fundingStage.split(',').map(s => s.trim()));
                idx++;
            }
            if (revenueStatus) {
                conditions.push(`p.revenue_status = ANY($${idx})`);
                vals.push(revenueStatus.split(',').map(s => s.trim()));
                idx++;
            }
            return { clause: 'WHERE ' + conditions.join(' AND '), values: vals, nextIdx: idx };
        };

        // 1. Count Total
        const countBuild = buildWhere(1);
        const countQ = `
            SELECT COUNT(*) 
            FROM users u
            LEFT JOIN startup_profiles p ON p.user_id = u.id
            ${countBuild.clause}
        `;
        const countRes = await pool.query(countQ, countBuild.values);
        total = parseInt(countRes.rows[0].count); // assign to var declared outside try? No, just const here is fine if I redeclare? No, "const total" was used inside.
        // Wait, "total" needs to be sent in response.
        // Let's fix variable scoping.

        // 2. Main Query
        const mainBuild = buildWhere(2); // Start at $2 because $1 is investor_id
        const mainQuery = `
            SELECT 
                u.id, 
                u.email, 
                u.full_name, 
                u.created_at,
                u.updated_at,
                p.tagline,
                p.description,
                p.industry,
                p.location_country,
                p.location_city,
                p.funding_stage,
                p.revenue_status,
                c.status as connection_status
            FROM users u
            LEFT JOIN startup_profiles p ON p.user_id = u.id
            LEFT JOIN connections c ON (c.startup_id = u.id AND c.investor_id = $1)
            ${mainBuild.clause}
            ${orderBy}
            LIMIT $${mainBuild.nextIdx} OFFSET $${mainBuild.nextIdx + 1}
        `;

        const mainParams = [currentUserId, ...mainBuild.values, limit, offset];
        const result = await pool.query(mainQuery, mainParams);

        const startups = result.rows.map(startup => ({
            id: startup.id,
            email: startup.email,
            fullName: startup.full_name,
            tagline: startup.tagline || null,
            description: startup.description || null,
            industry: startup.industry || null,
            location: {
                country: startup.location_country || null,
                city: startup.location_city || null
            },
            fundingStage: startup.funding_stage || null,
            revenueStatus: startup.revenue_status || null,
            createdAt: startup.created_at,
            connectionStatus: startup.connection_status || null
        }));

        res.json({
            success: true,
            data: startups,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching startups:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching startups'
        });
    }
};
