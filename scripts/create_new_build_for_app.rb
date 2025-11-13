#!/usr/bin/env ruby

require 'json'

slug = ARGV[0]
platform = ARGV[1] || "all"
increment_version = ARGV[2] || "true"

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

if increment_version == "true"
  system("ruby ./scripts/increment_version.rb #{slug}")
end

puts ""
puts ""

puts "-> Building App"
system("cd apps/#{slug} && eas build -p #{platform} --auto-submit")
