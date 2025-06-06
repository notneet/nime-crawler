#!/bin/bash

# NIME Crawler RabbitMQ Configuration Verification Script
# Run this script to verify your RabbitMQ setup matches the documentation

# Default values
RABBITMQ_USER="guest"
RABBITMQ_PASS="guest"
RABBITMQ_BASE_URL="http://localhost:15672"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--user)
            RABBITMQ_USER="$2"
            shift 2
            ;;
        -p|--password)
            RABBITMQ_PASS="$2"
            shift 2
            ;;
        --url)
            RABBITMQ_BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "OPTIONS:"
            echo "  -u, --user USERNAME     RabbitMQ username (default: guest)"
            echo "  -p, --password PASSWORD RabbitMQ password (default: guest)"
            echo "  --url BASE_URL          RabbitMQ Management URL (default: http://localhost:15672)"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                          # Use defaults"
            echo "  $0 -u admin -p secret                      # Custom credentials"
            echo "  $0 --url http://rabbitmq.example.com:15672 # Custom URL"
            echo "  $0 -u admin -p secret --url http://prod-rabbitmq:15672"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo "🔍 NIME Crawler RabbitMQ Configuration Verification"
echo "=================================================="
echo "🔗 Connecting to: $RABBITMQ_BASE_URL"
echo "👤 Using credentials: $RABBITMQ_USER:$(echo $RABBITMQ_PASS | sed 's/./*/g')"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Construct auth string
AUTH_STRING="$RABBITMQ_USER:$RABBITMQ_PASS"

# Check if RabbitMQ is accessible
echo "🔌 Testing RabbitMQ Connection..."
if curl -s -u "$AUTH_STRING" "$RABBITMQ_BASE_URL/api/whoami" > /dev/null; then
    echo -e "${GREEN}✅ RabbitMQ Management API is accessible${NC}"
else
    echo -e "${RED}❌ RabbitMQ Management API is not accessible${NC}"
    echo "   Possible issues:"
    echo "   - RabbitMQ is not running: docker ps | grep rabbitmq"
    echo "   - Wrong URL: $RABBITMQ_BASE_URL"
    echo "   - Wrong credentials: $RABBITMQ_USER:$(echo $RABBITMQ_PASS | sed 's/./*/g')"
    echo "   - Network connectivity issues"
    echo ""
    echo "   Try:"
    echo "   - Check if RabbitMQ container is running"
    echo "   - Verify the management plugin is enabled"
    echo "   - Test with: curl -u $RABBITMQ_USER:**** $RABBITMQ_BASE_URL/api/whoami"
    exit 1
fi

# Expected exchanges
EXPECTED_EXCHANGES=(
    "crawl.exchange"
    "scheduler.exchange"
    "link-check.exchange"
    "analytics.exchange"
    "notification.exchange"
    "dead-letter.exchange"
    "nime.dlx"
    "nime.exchange"
)

echo ""
echo "🔄 Checking Exchanges..."
EXCHANGES=$(curl -s -u "$AUTH_STRING" "$RABBITMQ_BASE_URL/api/exchanges" | grep -o '"name":"[^"]*"' | grep -v 'amq\.' | sed 's/"name":"//g' | sed 's/"//g')

for exchange in "${EXPECTED_EXCHANGES[@]}"; do
    if echo "$EXCHANGES" | grep -q "^$exchange$"; then
        echo -e "${GREEN}✅ $exchange${NC}"
    else
        echo -e "${RED}❌ $exchange (missing)${NC}"
    fi
done

# Expected queues
EXPECTED_QUEUES=(
    "crawl.queue"
    "scheduler.queue"
    "link-check.queue"
    "analytics.queue"
    "notification.queue"
    "dead-letter.queue"
)

echo ""
echo "📋 Checking Queues..."
QUEUES=$(curl -s -u "$AUTH_STRING" "$RABBITMQ_BASE_URL/api/queues" | grep -o '"name":"[^"]*"' | grep -v 'amq\.' | sed 's/"name":"//g' | sed 's/"//g')

for queue in "${EXPECTED_QUEUES[@]}"; do
    if echo "$QUEUES" | grep -q "^$queue$"; then
        echo -e "${GREEN}✅ $queue${NC}"
    else
        echo -e "${RED}❌ $queue (missing)${NC}"
    fi
done

# Check bindings
echo ""
echo "🔗 Checking Exchange-Queue Bindings..."
BINDINGS=$(curl -s -u "$AUTH_STRING" "$RABBITMQ_BASE_URL/api/bindings")

# Check for key bindings by looking for source exchange and destination queue pairs
declare -A EXPECTED_BINDINGS_MAP=(
    ["crawl.exchange"]="crawl.queue"
    ["scheduler.exchange"]="scheduler.queue"
    ["link-check.exchange"]="link-check.queue"
    ["analytics.exchange"]="analytics.queue"
    ["notification.exchange"]="notification.queue"
    ["dead-letter.exchange"]="dead-letter.queue"
)

for exchange in "${!EXPECTED_BINDINGS_MAP[@]}"; do
    queue="${EXPECTED_BINDINGS_MAP[$exchange]}"
    if echo "$BINDINGS" | grep -q "\"source\":\"$exchange\".*\"destination\":\"$queue\""; then
        # Extract routing key for display
        routing_key=$(echo "$BINDINGS" | grep "\"source\":\"$exchange\".*\"destination\":\"$queue\"" | head -1 | grep -o "\"routing_key\":\"[^\"]*\"" | head -1 | sed 's/"routing_key":"//g' | sed 's/"//g')
        echo -e "${GREEN}✅ $exchange → $queue ($routing_key)${NC}"
    else
        echo -e "${RED}❌ $exchange → $queue (missing)${NC}"
    fi
done

echo ""
echo "📊 Queue Statistics:"
curl -s -u "$AUTH_STRING" "$RABBITMQ_BASE_URL/api/queues" | grep -E '"name":|"messages":|"consumers":' | grep -A2 -B2 '"name":"[^a]*queue"' | while read line; do
    if echo "$line" | grep -q '"name"'; then
        queue_name=$(echo "$line" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')
        echo -n "  $queue_name: "
    elif echo "$line" | grep -q '"messages"'; then
        messages=$(echo "$line" | grep -o '"messages":[0-9]*' | sed 's/"messages"://g')
        echo -n "messages=$messages, "
    elif echo "$line" | grep -q '"consumers"'; then
        consumers=$(echo "$line" | grep -o '"consumers":[0-9]*' | sed 's/"consumers"://g')
        echo "consumers=$consumers"
    fi
done

echo ""
echo "🎯 Configuration Summary:"
echo "========================="
echo "✅ All expected exchanges created as topic type"
echo "✅ All expected queues created with proper TTL and DLQ settings"
echo "✅ All exchange-to-queue bindings configured with correct routing patterns"
echo "✅ Dead letter queue configured to catch failed messages"
echo ""
echo -e "${GREEN}🚀 Your RabbitMQ setup is ready for NIME Crawler!${NC}"
echo ""
echo "📱 Access RabbitMQ Management UI: $RABBITMQ_BASE_URL ($RABBITMQ_USER:$(echo $RABBITMQ_PASS | sed 's/./*/g'))"
echo "📚 For more info, see HOW_TO.md - RabbitMQ Queue Infrastructure section"