#!/usr/bin/env ruby

require 'json'

slug = ARGV[0]
business_name = ARGV[1]

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

app_dir = File.join(File.dirname(__FILE__), '..', 'apps', slug)

expo_config_path = File.join(app_dir, 'app.json')
expo_config = JSON.parse(File.read(expo_config_path))

def increment_semantic_version(version)
  major, minor, patch = version.split('.').map(&:to_i)
  patch += 1
  [major, minor, patch].join('.')
end

new_version = increment_semantic_version(expo_config["expo"]["version"])
new_ios_version = increment_semantic_version(expo_config["expo"]["ios"]["buildNumber"])
new_android_version = expo_config["expo"]["android"]["versionCode"].to_i + 1

puts "-> Updating Version: #{new_version} (iOS: #{new_ios_version}, Android: #{new_android_version})"

expo_config['expo']['version'] = new_version
expo_config['expo']['ios']['buildNumber'] = new_ios_version
expo_config['expo']['android']['versionCode'] = new_android_version

File.open(expo_config_path, 'w') do |f|
  f.write(JSON.pretty_generate(expo_config))
end
