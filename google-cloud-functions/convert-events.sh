#!/bin/bash
# Convert events route files to GCF format

# events
cp ../events/route.js events/index.js
sed -i '' 's/module.exports = async/exports.events = async/g' events/index.js
sed -i '' 's/res\.setHeader(/res.set(/g' events/index.js
sed -i '' "s/require('\.\/utils\/rbac')/require('\.\/utils\/rbac')/g" events/index.js

# events-all
cp ../events/all/route.js events-all/index.js
sed -i '' 's/module.exports = async/exports.eventsAll = async/g' events-all/index.js
sed -i '' 's/res\.setHeader(/res.set(/g' events-all/index.js
sed -i '' "s/require('\.\.\/utils\/rbac')/require('\.\/utils\/rbac')/g" events-all/index.js

# events-id
cp ../events/[id]/route.js events-id/index.js
sed -i '' 's/module.exports = async/exports.eventsId = async/g' events-id/index.js
sed -i '' 's/res\.setHeader(/res.set(/g' events-id/index.js
sed -i '' "s/require('\.\.\/utils\/rbac')/require('\.\/utils\/rbac')/g" events-id/index.js

# events-participants
cp ../events/[id]/participants/route.js events-participants/index.js
sed -i '' 's/module.exports = async/exports.eventsParticipants = async/g' events-participants/index.js
sed -i '' 's/res\.setHeader(/res.set(/g' events-participants/index.js
sed -i '' "s/require('\.\.\/\.\.\/utils\/rbac')/require('\.\/utils\/rbac')/g" events-participants/index.js

echo "✅ Converted all events functions"
