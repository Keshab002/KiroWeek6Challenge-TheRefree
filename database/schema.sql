-- The Referee Database Schema
-- PostgreSQL schema for decision-support tool

-- Options table: stores technical options to compare
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attributes table: stores attribute values for each option
CREATE TABLE attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  attribute_type VARCHAR(50) NOT NULL,  -- 'cost_model', 'scalability', 'complexity', 'maintenance'
  value VARCHAR(100) NOT NULL,
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('low', 'medium', 'high')),
  description TEXT,
  UNIQUE(option_id, attribute_type)
);

-- Weights table: stores default weights for attributes
CREATE TABLE weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_type VARCHAR(50) NOT NULL UNIQUE,
  default_weight DECIMAL(3,2) NOT NULL CHECK (default_weight >= 0 AND default_weight <= 1),
  scalability_low_modifier DECIMAL(3,2) DEFAULT 1.0,
  scalability_medium_modifier DECIMAL(3,2) DEFAULT 1.0,
  scalability_high_modifier DECIMAL(3,2) DEFAULT 1.0
);

-- Integrations table: stores available integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL
);

-- Option integrations: many-to-many relationship
CREATE TABLE option_integrations (
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  support_level VARCHAR(20) NOT NULL CHECK (support_level IN ('native', 'plugin', 'custom')),
  PRIMARY KEY (option_id, integration_id)
);

-- Indexes for query performance
CREATE INDEX idx_attributes_option_id ON attributes(option_id);
CREATE INDEX idx_option_integrations_option_id ON option_integrations(option_id);
CREATE INDEX idx_option_integrations_integration_id ON option_integrations(integration_id);
