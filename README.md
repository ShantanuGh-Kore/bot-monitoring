# bot-monitoring
This script bundle is for hosting a bot monitoring API which can be configured in any monitoring tool for monitoring a particular bot.

# Prequisites:
1. Node js should be installed in the env where the API will be hosted
2. Install the node modules by running "npm install"
3. Web/Mobile channel for the bot should be enabled
4. The bot should be in published state

# Configuration:
Following parameters need to be configured in the config.json:
1. Bot name
2. Bot stream id
3. Kore platform domain
4. RTM client app id - app enabled in the bot for the Web/RTM channel
5. RTM client secret - app enabled in the bot for the Web/RTM channel
6. Identity - bot developer email id
7. Bot developer first name
8. Bot developer last name

# Execution:
Run the application genericBotMonitoring.js as a node forever child process.

