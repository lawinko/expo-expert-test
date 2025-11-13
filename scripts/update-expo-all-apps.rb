# This script loops over all the apps and re-generates their App.tsx file using the ./scripts/write-app-tsx.sh bash script
# Typically used after a change to the App.tsx template file

require 'fileutils'

# Get the list of all apps
apps = Dir.glob('apps/*').select { |f| File.directory? f }

# Loop over all apps
apps.each do |app|
  # Get the app name
  app_name = File.basename(app)

  # Run the bash script to re-generate the App.tsx file
  system("cd ./apps/#{app_name}; npm install expo@~50.0.17")

  puts
  puts "-> Updated Expo for #{app_name}"
end
