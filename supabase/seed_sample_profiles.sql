-- ============================================================================
-- Seed: 15 sample startups + 15 sample investors
-- ----------------------------------------------------------------------------
-- Password for every account below: Test123!
-- (bcrypt cost-10 hash, same as server/scripts/create-test-users.js)
--
-- Safe to re-run: the users INSERT uses ON CONFLICT (email) DO NOTHING, and
-- each profile is inserted by joining back to its user row with a
-- "NOT EXISTS already-has-profile" guard, so a second run inserts nothing.
--
-- Verified against:
--   supabase/migrations/20260329_refined_startup_investor_profiles.sql
--   server/repositories/InvestorProfileRepository.js  (JSONB read as arrays)
--   server/scripts/create-test-users.js               (user_type is lowercase)
--
-- IMPORTANT:
--   * users.user_type is a plain lowercase varchar: startup or investor,
--     NOT the STARTUP/INVESTOR enum.
--   * The four *_enum columns use UPPER_SNAKE values (see comments below).
--   * investor JSONB focus columns MUST be JSON arrays — the discovery query
--     filters with  jsonb_typeof(col) = array  and silently ignores objects.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. USERS  (email_verified=true so the accounts can actually log in)
-- ---------------------------------------------------------------------------
INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
VALUES
  -- Startups
  ('sample.startup01@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Amara Silva',         'startup',  true),
  ('sample.startup02@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Dinesh Perera',       'startup',  true),
  ('sample.startup03@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Nethmi Fernando',     'startup',  true),
  ('sample.startup04@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Kasun Jayawardena',   'startup',  true),
  ('sample.startup05@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Ishara Gunasekara',   'startup',  true),
  ('sample.startup06@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Ruwan Bandara',       'startup',  true),
  ('sample.startup07@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Tharushi Mendis',     'startup',  true),
  ('sample.startup08@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Sahan Wickramasinghe','startup',  true),
  ('sample.startup09@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Hashini Rajapaksa',   'startup',  true),
  ('sample.startup10@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Chamod Senanayake',   'startup',  true),
  ('sample.startup11@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Pavithra Herath',     'startup',  true),
  ('sample.startup12@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Lahiru Dissanayake',  'startup',  true),
  ('sample.startup13@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Sanduni Weerasinghe', 'startup',  true),
  ('sample.startup14@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Yasiru Karunaratne',  'startup',  true),
  ('sample.startup15@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Oneli Abeysekara',    'startup',  true),
  -- Investors
  ('sample.investor01@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Rohan Mahesh',         'investor', true),
  ('sample.investor02@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Lanka Growth Partners','investor', true),
  ('sample.investor03@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Anjali Wijesinghe',    'investor', true),
  ('sample.investor04@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Ceylon Ventures',      'investor', true),
  ('sample.investor05@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Pradeep Kumar',        'investor', true),
  ('sample.investor06@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Indigo Capital',       'investor', true),
  ('sample.investor07@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Menaka De Silva',      'investor', true),
  ('sample.investor08@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Summit Angels',        'investor', true),
  ('sample.investor09@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Dilani Rathnayake',    'investor', true),
  ('sample.investor10@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Horizon Family Office','investor', true),
  ('sample.investor11@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Nuwan Atapattu',       'investor', true),
  ('sample.investor12@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Velocity Accelerator', 'investor', true),
  ('sample.investor13@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Shenali Cooray',       'investor', true),
  ('sample.investor14@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Apex Private Equity',  'investor', true),
  ('sample.investor15@starthub.test', '$2b$10$zjJ83IUIqkEhBPuJZTk90unvYUlHt.g.qboNIUfb28W.nEUTox8xu', 'Tharindu Ekanayake',   'investor', true)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. STARTUP PROFILES
--    Required: company_name, founder_names, tagline, detailed_description,
--      industry, founded_date, current_stage, team_size, funding_stage,
--      amount_seeking, use_of_funds, revenue_status, primary_contact_name,
--      contact_email.
--    Enums: current_stage  IDEA|MVP|EARLY_REVENUE|GROWTH|SCALING
--           funding_stage  PRE_SEED|SEED|SERIES_A|SERIES_B|SERIES_C|SERIES_D_PLUS
--           revenue_status PRE_REVENUE|REVENUE_GENERATING|PROFITABLE
--    Checks: amount_seeking>0, previous_funding>=0, team_size>0.
-- ---------------------------------------------------------------------------
INSERT INTO public.startup_profiles (
  user_id, company_name, founder_names, tagline, detailed_description, industry,
  founded_date, current_stage, team_size, funding_stage, amount_seeking,
  previous_funding, use_of_funds, revenue_status, key_metrics, major_achievements,
  primary_contact_name, contact_email, phone_number, social_media_links,
  location_country, location_city, website_url
)
SELECT
  u.id, v.company_name, v.founder_names, v.tagline, v.detailed_description, v.industry,
  v.founded_date::date, v.current_stage::startup_stage_enum, v.team_size,
  v.funding_stage::funding_stage_enum, v.amount_seeking, v.previous_funding,
  v.use_of_funds, v.revenue_status::revenue_status_enum, v.key_metrics, v.major_achievements,
  v.primary_contact_name, v.contact_email, v.phone_number, v.social_media_links::jsonb,
  v.location_country, v.location_city, v.website_url
FROM (
  VALUES
  ('sample.startup01@starthub.test','PayLanka','Amara Silva','Instant digital wallet for everyone','A mobile-first digital wallet enabling instant peer-to-peer payments and bill settlement across Sri Lanka.','FinTech','2022-03-15','GROWTH',18,'SERIES_A',1500000,250000,'Engineering hires, regulatory licensing, and market expansion to two new regions.','REVENUE_GENERATING','120k MAU, 22% MoM growth','Licensed by the Central Bank as a payment provider','Amara Silva','contact@paylanka.test','+94711234501','{"linkedin":"https://linkedin.com/company/paylanka"}','Sri Lanka','Colombo','https://paylanka.test'),
  ('sample.startup02@starthub.test','MediTrack','Dinesh Perera','AI triage for rural clinics','Clinical decision-support that helps rural health workers triage patients using a lightweight offline-first app.','HealthTech','2021-09-01','EARLY_REVENUE',12,'SEED',600000,100000,'Clinical validation studies and onboarding 50 additional clinics.','REVENUE_GENERATING','40 partner clinics, 9k patients screened','Won national digital health innovation award','Dinesh Perera','hello@meditrack.test','+94711234502','{"linkedin":"https://linkedin.com/company/meditrack"}','Sri Lanka','Kandy','https://meditrack.test'),
  ('sample.startup03@starthub.test','EduSpark','Nethmi Fernando','Adaptive learning for O/L students','An adaptive learning platform tailoring practice questions to each student weak areas for O/L and A/L exams.','EdTech','2023-01-20','MVP',6,'PRE_SEED',150000,0,'Content production and a pilot with five schools.','PRE_REVENUE','3k beta signups','Selected for a national EdTech incubator','Nethmi Fernando','team@eduspark.test','+94711234503','{"instagram":"https://instagram.com/eduspark"}','Sri Lanka','Galle','https://eduspark.test'),
  ('sample.startup04@starthub.test','AgriSense','Kasun Jayawardena','IoT soil monitoring for smallholders','Low-cost IoT soil sensors and an advisory app that help smallholder farmers optimise irrigation and fertiliser use.','AgriTech','2022-06-10','EARLY_REVENUE',9,'SEED',500000,75000,'Hardware manufacturing scale-up and field agronomist team.','REVENUE_GENERATING','1,200 sensors deployed','Cut water usage 30% in pilot farms','Kasun Jayawardena','info@agrisense.test','+94711234504','{"linkedin":"https://linkedin.com/company/agrisense"}','Sri Lanka','Anuradhapura','https://agrisense.test'),
  ('sample.startup05@starthub.test','SolarGrid','Ishara Gunasekara','Community solar made simple','A platform that lets neighbourhoods co-own rooftop solar installations and share generated power and savings.','CleanTech','2021-04-05','GROWTH',22,'SERIES_A',2000000,400000,'New installations, battery storage R&D, and a financing partnership.','REVENUE_GENERATING','3.5 MW installed','Powered 800 homes with clean energy','Ishara Gunasekara','contact@solargrid.test','+94711234505','{"linkedin":"https://linkedin.com/company/solargrid"}','Sri Lanka','Colombo','https://solargrid.test'),
  ('sample.startup06@starthub.test','LogiFlow','Ruwan Bandara','Last-mile delivery, optimised','A route-optimisation and dispatch platform for last-mile delivery fleets serving e-commerce merchants.','Logistics','2022-11-12','EARLY_REVENUE',14,'SEED',750000,120000,'Driver app rebuild and expansion to two new cities.','REVENUE_GENERATING','18k deliveries/month','Reduced delivery cost per order by 24%','Ruwan Bandara','ops@logiflow.test','+94711234506','{"linkedin":"https://linkedin.com/company/logiflow"}','Sri Lanka','Negombo','https://logiflow.test'),
  ('sample.startup07@starthub.test','LegalEase','Tharushi Mendis','Contracts in plain language','An AI assistant that reviews and explains business contracts in plain language for SMEs without in-house counsel.','LegalTech','2023-02-28','MVP',5,'PRE_SEED',200000,0,'Model fine-tuning and onboarding the first 100 paying SMEs.','PRE_REVENUE','500 documents reviewed in beta','Top-10 finish at a regional startup pitch','Tharushi Mendis','hi@legalease.test','+94711234507','{"linkedin":"https://linkedin.com/company/legalease"}','Sri Lanka','Colombo','https://legalease.test'),
  ('sample.startup08@starthub.test','PropFinder','Sahan Wickramasinghe','Verified rentals, zero brokers','A rental marketplace with verified listings and digital agreements, removing brokers from the renting process.','PropTech','2021-12-01','GROWTH',16,'SERIES_A',1200000,300000,'Marketplace liquidity, trust and safety, and a mortgage partner integration.','REVENUE_GENERATING','9k verified listings','Facilitated LKR 2B in rentals','Sahan Wickramasinghe','team@propfinder.test','+94711234508','{"facebook":"https://facebook.com/propfinder"}','Sri Lanka','Colombo','https://propfinder.test'),
  ('sample.startup09@starthub.test','InsureBee','Hashini Rajapaksa','Micro-insurance in a tap','Bite-sized micro-insurance products (device, travel, health) sold and claimed entirely through a mobile app.','InsurTech','2022-08-18','EARLY_REVENUE',11,'SEED',650000,90000,'Actuarial team, new product lines, and a bancassurance partnership.','REVENUE_GENERATING','30k policies active','Claims settled in under 24 hours','Hashini Rajapaksa','care@insurebee.test','+94711234509','{"linkedin":"https://linkedin.com/company/insurebee"}','Sri Lanka','Colombo','https://insurebee.test'),
  ('sample.startup10@starthub.test','FreshCart','Chamod Senanayake','Farm-to-door groceries','A grocery platform sourcing produce directly from farmers and delivering to urban households within hours.','FoodTech','2021-07-22','GROWTH',25,'SERIES_A',1800000,350000,'Cold-chain logistics, farmer onboarding, and a new fulfilment centre.','REVENUE_GENERATING','15k orders/month','Partnered with 600 farmers','Chamod Senanayake','support@freshcart.test','+94711234510','{"instagram":"https://instagram.com/freshcart"}','Sri Lanka','Colombo','https://freshcart.test'),
  ('sample.startup11@starthub.test','TripWise','Pavithra Herath','Personalised Sri Lanka itineraries','An AI travel planner that builds personalised multi-day Sri Lanka itineraries and books local experiences.','TravelTech','2023-03-30','MVP',7,'PRE_SEED',180000,0,'Inventory partnerships and a marketing push for the upcoming season.','PRE_REVENUE','2k trips planned in beta','Featured by a major travel publication','Pavithra Herath','hello@tripwise.test','+94711234511','{"instagram":"https://instagram.com/tripwise"}','Sri Lanka','Galle','https://tripwise.test'),
  ('sample.startup12@starthub.test','PlayForge','Lahiru Dissanayake','Mobile games studio','An indie mobile games studio building casual multiplayer titles for South Asian audiences.','Gaming','2022-02-14','EARLY_REVENUE',13,'SEED',900000,150000,'New title production and live-ops tooling.','REVENUE_GENERATING','2M downloads','One title hit national top-charts','Lahiru Dissanayake','studio@playforge.test','+94711234512','{"twitter":"https://twitter.com/playforge"}','Sri Lanka','Colombo','https://playforge.test'),
  ('sample.startup13@starthub.test','ShieldSec','Sanduni Weerasinghe','Security monitoring for SMEs','A managed security monitoring service giving SMEs enterprise-grade threat detection at an affordable price.','Cybersecurity','2021-10-08','GROWTH',19,'SERIES_A',1400000,280000,'SOC team expansion and a self-serve product tier.','REVENUE_GENERATING','140 clients protected','Blocked a major supply-chain attack for a client','Sanduni Weerasinghe','contact@shieldsec.test','+94711234513','{"linkedin":"https://linkedin.com/company/shieldsec"}','Sri Lanka','Colombo','https://shieldsec.test'),
  ('sample.startup14@starthub.test','ChainTrace','Yasiru Karunaratne','Blockchain supply traceability','A blockchain platform that traces tea and spice exports from farm to shelf for provenance and compliance.','Blockchain','2022-05-19','MVP',8,'PRE_SEED',220000,20000,'Pilot integrations with exporters and certification bodies.','PRE_REVENUE','3 exporter pilots running','Validated by a major certification body','Yasiru Karunaratne','team@chaintrace.test','+94711234514','{"linkedin":"https://linkedin.com/company/chaintrace"}','Sri Lanka','Colombo','https://chaintrace.test'),
  ('sample.startup15@starthub.test','VitaLabs','Oneli Abeysekara','Biotech diagnostics kits','Affordable rapid diagnostic kits for common tropical diseases, designed and manufactured locally.','BioTech','2021-03-03','EARLY_REVENUE',15,'SERIES_A',2500000,500000,'Manufacturing scale-up, regulatory approval, and export expansion.','REVENUE_GENERATING','200k kits sold','Approved by the national drug regulator','Oneli Abeysekara','info@vitalabs.test','+94711234515','{"linkedin":"https://linkedin.com/company/vitalabs"}','Sri Lanka','Colombo','https://vitalabs.test')
) AS v(email, company_name, founder_names, tagline, detailed_description, industry,
       founded_date, current_stage, team_size, funding_stage, amount_seeking,
       previous_funding, use_of_funds, revenue_status, key_metrics, major_achievements,
       primary_contact_name, contact_email, phone_number, social_media_links,
       location_country, location_city, website_url)
JOIN public.users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM public.startup_profiles sp WHERE sp.user_id = u.id);

-- ---------------------------------------------------------------------------
-- 3. INVESTOR PROFILES
--    Required: name_or_firm, investor_type, years_of_experience,
--      professional_background, investment_thesis, industries_of_interest,
--      geographic_preference, stage_preference, min_investment_size,
--      max_investment_size, investment_structure, follow_on_investment,
--      investment_timeline, what_you_look_for, value_add,
--      primary_contact_email, preferred_contact_method.
--    Enum: investor_type ANGEL|VC_FIRM|CORPORATE_VC|FAMILY_OFFICE|ACCELERATOR|
--                        INCUBATOR|PRIVATE_EQUITY
--    Checks: years_of_experience>=0, min<=max, min>0, number_of_investments>=0.
--    The four JSONB focus columns are JSON ARRAYS (required by the discovery
--    discovery query jsonb_typeof = array filter). Industry/stage values match
--    client/src/utils/investorFilterOptions.js.
-- ---------------------------------------------------------------------------
INSERT INTO public.investor_profiles (
  user_id, name_or_firm, investor_type, years_of_experience, professional_background,
  investment_thesis, industries_of_interest, geographic_preference, stage_preference,
  min_investment_size, max_investment_size, investment_structure, follow_on_investment,
  investment_timeline, number_of_investments, portfolio_companies, what_you_look_for,
  value_add, primary_contact_email, phone_number, preferred_contact_method
)
SELECT
  u.id, v.name_or_firm, v.investor_type::investor_type_enum, v.years_of_experience,
  v.professional_background, v.investment_thesis,
  v.industries_of_interest::jsonb, v.geographic_preference::jsonb, v.stage_preference::jsonb,
  v.min_investment_size, v.max_investment_size, v.investment_structure::jsonb,
  v.follow_on_investment, v.investment_timeline, v.number_of_investments,
  v.portfolio_companies, v.what_you_look_for, v.value_add,
  v.primary_contact_email, v.phone_number, v.preferred_contact_method
FROM (
  VALUES
  ('sample.investor01@starthub.test','Rohan Mahesh','ANGEL',12,'Former fintech operator turned angel investor with two exits.','Back mission-driven founders solving real friction in financial access.','["FinTech","InsurTech","SaaS"]','["Sri Lanka","South Asia"]','["PRE_SEED","SEED"]',25000,150000,'["Equity","SAFE"]',true,'1-3 months',14,'PayLanka, several seed-stage fintechs','Clear traction signals and a coachable founding team.','Hands-on go-to-market and fintech regulatory guidance.','rohan@starthub.test','+94771000001','email'),
  ('sample.investor02@starthub.test','Lanka Growth Partners','VC_FIRM',9,'A growth-stage venture firm investing across South Asian tech.','Fund category leaders with strong unit economics at Series A and beyond.','["FinTech","E-Commerce","Logistics","SaaS"]','["Sri Lanka","India","Bangladesh"]','["SERIES_A","SERIES_B"]',250000,2000000,'["Equity"]',true,'3-6 months',21,'FreshCart, PropFinder','Defensible growth, healthy margins, and a strong second line of leadership.','Board-level guidance, follow-on capital, and regional networks.','deals@starthub.test','+94771000002','email'),
  ('sample.investor03@starthub.test','Anjali Wijesinghe','ANGEL',7,'Healthcare professional and angel investor focused on health innovation.','Improve healthcare access through technology that reaches underserved communities.','["HealthTech","BioTech"]','["Sri Lanka"]','["IDEA","MVP","SEED"]',15000,100000,'["Equity","SAFE","Convertible Note"]',false,'1-3 months',6,'MediTrack','Founders with deep domain insight and a credible clinical pathway.','Clinical validation support and hospital introductions.','anjali@starthub.test','+94771000003','phone'),
  ('sample.investor04@starthub.test','Ceylon Ventures','VC_FIRM',11,'An early-stage fund backing Sri Lankan technology startups.','Be the first institutional cheque for the most ambitious founders in the country.','["SaaS","AI/ML","FinTech","CleanTech"]','["Sri Lanka","Southeast Asia"]','["PRE_SEED","SEED","SERIES_A"]',50000,500000,'["Equity","SAFE"]',true,'1-3 months',30,'SolarGrid, LogiFlow, ShieldSec','A large market, a sharp wedge, and relentless execution.','Recruiting, fundraising strategy, and a strong founder community.','hello@ceylonventures.test','+94771000004','email'),
  ('sample.investor05@starthub.test','Pradeep Kumar','ANGEL',15,'Serial entrepreneur and angel with experience scaling marketplaces.','Invest in marketplaces and consumer platforms with network effects.','["E-Commerce","TravelTech","FoodTech","Logistics"]','["Sri Lanka","South Asia"]','["SEED","SERIES_A"]',30000,200000,'["Equity"]',true,'1-3 months',18,'FreshCart, TripWise','Strong retention and a clear path to marketplace liquidity.','Marketplace growth playbooks and supply-side partnerships.','pradeep@starthub.test','+94771000005','email'),
  ('sample.investor06@starthub.test','Indigo Capital','CORPORATE_VC',8,'The venture arm of a regional conglomerate.','Invest strategically where startups complement our core businesses.','["Logistics","CleanTech","PropTech","IoT"]','["Sri Lanka","India"]','["SERIES_A","SERIES_B","SERIES_C"]',300000,3000000,'["Equity"]',true,'3-6 months',12,'PropFinder','Strategic fit, strong governance, and proven revenue.','Distribution through group channels and infrastructure access.','ventures@indigo.test','+94771000006','email'),
  ('sample.investor07@starthub.test','Menaka De Silva','ANGEL',6,'Product leader and angel investing in early SaaS and AI.','Bet on technical founders building developer-loved products.','["SaaS","AI/ML","Cybersecurity"]','["Sri Lanka","Global"]','["PRE_SEED","SEED"]',10000,75000,'["SAFE","Convertible Note"]',false,'1-3 months',9,'ShieldSec, LegalEase','Technical depth and early signs of product-led growth.','Product strategy and hiring senior engineers.','menaka@starthub.test','+94771000007','phone'),
  ('sample.investor08@starthub.test','Summit Angels','ACCELERATOR',5,'An angel collective and accelerator for first-time founders.','Help first-time founders go from idea to first revenue.','["EdTech","FinTech","FoodTech","Gaming"]','["Sri Lanka"]','["IDEA","MVP"]',5000,50000,'["SAFE"]',false,'1-3 months',40,'EduSpark, PlayForge','Coachability, speed of iteration, and customer obsession.','A 12-week program, mentorship, and demo-day exposure.','apply@summitangels.test','+94771000008','email'),
  ('sample.investor09@starthub.test','Dilani Rathnayake','ANGEL',10,'Agribusiness executive investing in sustainable food and farming.','Fund technology that makes agriculture more productive and sustainable.','["AgriTech","FoodTech","CleanTech"]','["Sri Lanka","Africa"]','["SEED","SERIES_A"]',20000,180000,'["Equity","SAFE"]',true,'3-6 months',11,'AgriSense','A scalable model and measurable impact on farmer livelihoods.','Agronomy expertise and rural distribution networks.','dilani@starthub.test','+94771000009','email'),
  ('sample.investor10@starthub.test','Horizon Family Office','FAMILY_OFFICE',20,'A multi-generational family office diversifying into venture.','Preserve and grow capital through selective long-horizon tech bets.','["CleanTech","BioTech","FinTech","PropTech"]','["Sri Lanka","Singapore","UAE"]','["SERIES_A","SERIES_B","SERIES_C"]',500000,5000000,'["Equity"]',true,'6+ months',16,'SolarGrid, VitaLabs','Durable businesses with experienced teams and clear governance.','Patient capital and access to a global partner network.','office@horizon.test','+94771000010','email'),
  ('sample.investor11@starthub.test','Nuwan Atapattu','ANGEL',13,'Cybersecurity veteran and active angel in deep tech.','Invest in security and infrastructure that the next decade will run on.','["Cybersecurity","IoT","Blockchain","AI/ML"]','["Sri Lanka","Global"]','["SEED","SERIES_A"]',25000,250000,'["Equity","SAFE"]',true,'1-3 months',15,'ShieldSec, ChainTrace','A hard technical moat and a security-first culture.','Threat-model reviews and enterprise security introductions.','nuwan@starthub.test','+94771000011','phone'),
  ('sample.investor12@starthub.test','Velocity Accelerator','ACCELERATOR',4,'A sector-agnostic accelerator running cohort-based programs.','Compress the early journey with capital, mentorship, and network.','["SaaS","E-Commerce","EdTech","TravelTech"]','["Sri Lanka","South Asia"]','["IDEA","MVP","PRE_SEED"]',10000,60000,'["SAFE"]',false,'1-3 months',55,'TripWise, EduSpark','A motivated team and early evidence of demand.','Structured curriculum, investor demo day, and alumni network.','hello@velocity.test','+94771000012','email'),
  ('sample.investor13@starthub.test','Shenali Cooray','ANGEL',8,'Consumer brand builder and angel in commerce and lifestyle.','Back founders building beloved consumer brands and experiences.','["E-Commerce","FoodTech","TravelTech","Gaming"]','["Sri Lanka"]','["SEED","SERIES_A"]',15000,120000,'["Equity","SAFE"]',true,'1-3 months',10,'FreshCart, PlayForge','Brand love, strong retention, and an authentic founder story.','Brand, marketing, and retail partnership support.','shenali@starthub.test','+94771000013','email'),
  ('sample.investor14@starthub.test','Apex Private Equity','PRIVATE_EQUITY',18,'A private equity firm taking later-stage growth positions.','Scale proven businesses toward profitability and exit.','["FinTech","Logistics","PropTech","SaaS"]','["Sri Lanka","India","Southeast Asia"]','["SERIES_B","SERIES_C","SERIES_D_PLUS"]',1000000,10000000,'["Equity"]',true,'6+ months',9,'PropFinder','Strong cash flow, defensible position, and a clear path to exit.','Operational scaling, M&A, and capital-markets readiness.','deals@apexpe.test','+94771000014','email'),
  ('sample.investor15@starthub.test','Tharindu Ekanayake','ANGEL',5,'Software engineer turned angel investor in early AI and SaaS.','Support technical founders shipping AI products with real users.','["AI/ML","SaaS","LegalTech","HealthTech"]','["Sri Lanka","Global"]','["PRE_SEED","SEED"]',10000,80000,'["SAFE","Convertible Note"]',false,'1-3 months',7,'LegalEase, MediTrack','A working prototype, early users, and fast iteration.','Technical mentorship and AI product strategy.','tharindu@starthub.test','+94771000015','email')
) AS v(email, name_or_firm, investor_type, years_of_experience, professional_background,
       investment_thesis, industries_of_interest, geographic_preference, stage_preference,
       min_investment_size, max_investment_size, investment_structure, follow_on_investment,
       investment_timeline, number_of_investments, portfolio_companies, what_you_look_for,
       value_add, primary_contact_email, phone_number, preferred_contact_method)
JOIN public.users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM public.investor_profiles ip WHERE ip.user_id = u.id);

COMMIT;

-- ---------------------------------------------------------------------------
-- Quick verification (optional):
--   SELECT user_type, COUNT(*) FROM public.users
--   WHERE email LIKE sample-percent-at-starthub.test GROUP BY user_type;
--   -- expect: startup 15, investor 15
--   (Run the SELECTs at the bottom note as their own queries if you want counts.)
-- ---------------------------------------------------------------------------
