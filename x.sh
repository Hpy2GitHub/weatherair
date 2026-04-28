# Create a temp directory outside your repo
#mkdir ~/temp_restore

# Copy files to temp directory (preserving folder structure)
#git archive 326855a729bce0dd3a01aa5bcbfaae4ae97658ba -- <file1> <file2> <file3> | tar -x -C ~/temp_restore
git archive 326855a729bce0dd3a01aa5bcbfaae4ae97658ba -- src/App.jsx src/CustomizePanel.jsx  src/App.jsx src/CustomizePanel.jsx src/LocationPicker.jsx src/RefreshButton.jsx src/hooks/useWeatherData.js | tar -x -C ~/temp_restore
