#!/usr/bin/env ruby

require 'json'

# TODO: Get from ENV
slug = ARGV[0]
business_name = ARGV[1]
team_id = ARGV[2]
app_id = ARGV[3]

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

app_dir = File.join(File.dirname(__FILE__), '..', 'apps', slug)

eas_config_path = File.join(app_dir, 'eas.json')
eas_config = JSON.parse(File.read(eas_config_path))

eas_config['submit']['production']['ios']["companyName"] = business_name

if !team_id.nil? && team_id.length > 0
  eas_config['submit']['production']['ios']["appleTeamId"] = team_id
end

if !app_id.nil? && app_id.length > 0
  eas_config['submit']['production']['ios']["ascAppId"] = app_id
end

File.open(eas_config_path, 'w') do |f|
  f.write(JSON.pretty_generate(eas_config))
end
