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
  system("./scripts/write-app-tsx.sh #{app_name}")

  puts
  puts "-> Rewrote App.tsx for #{app_name}"
end
