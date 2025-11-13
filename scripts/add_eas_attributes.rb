#!/usr/bin/env ruby

require 'json'

slug = ARGV[0]
business_name = ARGV[1]

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

app_dir = File.join(File.dirname(__FILE__), '..', 'apps', slug)

eas_config_path = File.join(app_dir, 'eas.json')
eas_config = JSON.parse(File.read(eas_config_path))

eas_config['submit']['production'] = {
  "android": {
    "serviceAccountKeyPath": '../../secrets/pc-api.json'
  },
  "ios": {
    "appleId": 'accounts@fitterapp.co'
  }
}

File.open(eas_config_path, 'w') do |f|
  f.write(JSON.pretty_generate(eas_config))
end
