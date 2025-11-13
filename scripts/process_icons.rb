#!/usr/bin/env ruby

require 'open-uri'
require 'fileutils'
require 'json'

slug = ARGV[0]

raise 'Please supply a valid trainer subdomain. E.g. samfitter' unless slug

app_url = "https://#{slug}.mvt.so"

output_dir = File.join(File.dirname(__FILE__), '..', 'apps', slug)
assets_dir = File.join(output_dir, 'assets')
splash_url = ''
manifest = nil
global_state = nil

puts '🗑 Removing existing icons'
# These images are added automatically by Expo
adaptive_icon_path = File.join(assets_dir, 'adaptive-icon.png')
favicon_path = File.join(assets_dir, 'favicon.png')
icon_path = File.join(assets_dir, 'icon.png')
splash_path = File.join(assets_dir, 'splash.png')

icon_paths = [adaptive_icon_path, favicon_path, icon_path, splash_path]

icon_paths.each { |p| File.delete(p) if File.exist?(p) }

puts '📦 Fetching manifest.json'
app_manifest_path = "#{app_url}/__/manifest.json"
global_state_path = "#{app_url}/__/global.js"

URI.open(app_manifest_path) { |io| manifest = JSON.parse(io.read) }

puts '📦 Fetching global.js'
URI.open(global_state_path) do |io|
  response = io.read
  formatted_response = response
                       .gsub('window.', '')
                       .gsub('FIT_globalState=', '')
                       .gsub('FIT_globalState = ', '')
  global_state = JSON.parse(formatted_response)
  splash_url = global_state['meta']['splash_images']['1125x2436']['src']
end

icons_by_size = manifest['icons'].each_with_object({}) do |icon, acc|
  acc[icon['sizes']] = icon['src']
end

puts '📎️ Processing icon.png'
URI.open(icons_by_size['512x512']) do |image|
  File.write(File.join(assets_dir, 'icon.png'), image.read)
end

# For some reason Imgix sometimes doesnt produce a valid PNG file which breaks the Android build on iOS
# So, we use imagemagick to ensure the png is actually a valid png file
#
# $(pwd) evaluates to the root of the repo
`docker run --rm -v $(pwd)/apps/#{slug}/assets/:/imgs dpokidov/imagemagick /imgs/icon.png /imgs/icon.png`

puts '📎️ Processing splash.png'
URI.open(splash_url) do |image|
  File.write(File.join(assets_dir, 'splash.png'), image.read)
end
# $(pwd) evaluates to the root of the repo
`docker run --rm -v $(pwd)/apps/#{slug}/assets/:/imgs dpokidov/imagemagick /imgs/splash.png /imgs/splash.png`

puts '✅ Done'
