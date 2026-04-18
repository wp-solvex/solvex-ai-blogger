#!/bin/bash
# Run release script
#bash bin/i18n.sh

# Notice for POT file existence.
echo "Ensure the POT file is already generated..."

# Update PO files
echo "Updating PO files..."
npm run i18n:po

# Translate using GPT-PO for multiple languages
echo "Translating PO files using GPT-PO..."
npm run i18n:all-langs

# Update PO files again after translation
echo "Updating PO files again..."
npm run i18n:po

# Generate MO files
echo "Generating MO files..."
npm run i18n:mo

# Generate JSON translation files
echo "Generating JSON translation files..."
npm run i18n:json

echo "All commands executed successfully."
