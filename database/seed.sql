-- The Referee Seed Data
-- Minimal sample data - add more via Admin Panel

-- Clear existing data
TRUNCATE options, attributes, weights, integrations, option_integrations CASCADE;

-- Insert Options (reduced to 3 core examples)
INSERT INTO options (id, name, description, category) VALUES
  ('11111111-1111-1111-1111-111111111111', 'AWS Lambda', 'Serverless compute service that runs code in response to events. Pay only for compute time consumed with automatic scaling.', 'compute'),
  ('22222222-2222-2222-2222-222222222222', 'AWS EC2', 'Virtual servers in the cloud with full control over the operating system. Flexible instance types for various workloads.', 'compute'),
  ('33333333-3333-3333-3333-333333333333', 'PostgreSQL', 'Powerful open-source relational database with ACID compliance, complex queries, and strong data integrity.', 'database');

-- Insert Attributes for AWS Lambda
INSERT INTO attributes (option_id, attribute_type, value, rating, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'cost_model', 'Pay-per-execution', 'low', 'Only pay for actual compute time, ideal for sporadic workloads'),
  ('11111111-1111-1111-1111-111111111111', 'scalability', 'Auto-scaling', 'high', 'Automatically scales from zero to thousands of concurrent executions'),
  ('11111111-1111-1111-1111-111111111111', 'complexity', 'Low setup', 'low', 'No server management, just deploy code'),
  ('11111111-1111-1111-1111-111111111111', 'maintenance', 'Minimal', 'low', 'AWS handles all infrastructure maintenance');

-- Insert Attributes for AWS EC2
INSERT INTO attributes (option_id, attribute_type, value, rating, description) VALUES
  ('22222222-2222-2222-2222-222222222222', 'cost_model', 'Hourly/Reserved', 'medium', 'Pay for running instances, savings with reserved capacity'),
  ('22222222-2222-2222-2222-222222222222', 'scalability', 'Manual/Auto-scaling groups', 'medium', 'Requires configuration but offers fine-grained control'),
  ('22222222-2222-2222-2222-222222222222', 'complexity', 'Full control', 'high', 'Complete OS access requires more expertise'),
  ('22222222-2222-2222-2222-222222222222', 'maintenance', 'Self-managed', 'high', 'Responsible for OS updates, security patches, monitoring');

-- Insert Attributes for PostgreSQL
INSERT INTO attributes (option_id, attribute_type, value, rating, description) VALUES
  ('33333333-3333-3333-3333-333333333333', 'cost_model', 'Open source', 'low', 'Free to use, pay only for hosting infrastructure'),
  ('33333333-3333-3333-3333-333333333333', 'scalability', 'Vertical + Read replicas', 'medium', 'Scales vertically well, horizontal requires more effort'),
  ('33333333-3333-3333-3333-333333333333', 'complexity', 'SQL expertise needed', 'medium', 'Requires understanding of relational modeling'),
  ('33333333-3333-3333-3333-333333333333', 'maintenance', 'Regular tuning', 'medium', 'Needs periodic vacuum, index optimization');

-- Insert Default Weights
INSERT INTO weights (attribute_type, default_weight, scalability_low_modifier, scalability_medium_modifier, scalability_high_modifier) VALUES
  ('cost_model', 0.30, 1.2, 1.0, 0.8),
  ('scalability', 0.25, 0.6, 1.0, 1.5),
  ('complexity', 0.25, 1.0, 1.0, 0.9),
  ('maintenance', 0.20, 1.1, 1.0, 0.9);

-- Insert Integrations (reduced to 3 core examples)
INSERT INTO integrations (id, name, category) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AWS S3', 'storage'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Docker', 'containerization'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'GitHub Actions', 'ci_cd');

-- Insert Option Integrations - ALL options support ALL integrations
INSERT INTO option_integrations (option_id, integration_id, support_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'native'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'native'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'native'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'native'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'native'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'native'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'native'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'native'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'native');
