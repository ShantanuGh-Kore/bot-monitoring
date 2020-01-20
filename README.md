# bot-monitoring
This script bundle is for hosting a bot monitoring API which can be configured in any monitoring tool for monitoring a particular bot. The script has been updated to accomodate platform "onConnect" event. The API return the response time from bot platform in milliseconds.

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

# Sample request
http://localhost:3000/send?message=hi

# Smaple response:
{"type":"bot_response","from":"bot","message":[{"type":"text","component":{"type":"text","payload":{"text":"Welcome to the bot world."}},"cInfo":{"body":"Welcome to the bot world."}}],"messageId":"ms-b87a99ea-8fda-5864-8a49-5f3857d0eb20","botInfo":{"chatBot":"evalue Chatbot","taskBotId":"st-d3b2bb14-d413-5a7a-9c0f-8b6deec21088"},"createdOn":"2020-01-20T02:44:47.338Z","icon":"https://cloudfront.net/sample.png", "traceId":"68eeb241fedf5e15","responseTimeMs":242}


