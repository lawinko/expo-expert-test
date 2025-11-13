#!/usr/bin/env ruby

require 'open-uri'
require 'json'

slug = ARGV[0]

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

app_url = "https://#{slug}.mvt.so"

manifest = nil

app_manifest_path = "#{app_url}/__/manifest.json"

URI.open(app_manifest_path) { |io| manifest = JSON.parse(io.read) }

puts manifest['name']
