# NIME Crawler - Testing & Development How-To Guide

This guide explains how to test and develop the NIME Crawler microservice architecture, from initial setup to end-to-end workflow testing.

## 🏗️ Architecture Overview

The NIME Crawler is a microservice-based anime aggregation system built with NestJS. It consists of:

### **Core Services**
- **API Gateway** - HTTP entry point for scheduling crawl jobs
- **Crawler Service** - Background job consumer that scrapes anime sources  
- **Scheduler Service** - Manages periodic crawling tasks
- **Analytics Service** - Tracks usage metrics and statistics
- **Notification Service** - Sends alerts via Discord/Telegram/Email
- **Link Checker Service** - Validates download link availability
- **Mailer Service** - Email template processing and delivery

### **Infrastructure Components**
- **MySQL** - Primary database for anime data
- **Redis** - Caching layer and session storage
- **RabbitMQ** - Message queue for job processing
- **Consul** - Service discovery (optional)

---

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js 16+
- Docker & Docker Compose
- curl or Postman for API testing

### **1. Initial Setup**

```bash
# Clone and install dependencies
git clone <repository-url>
cd nime-crawler
make install

# Start infrastructure services
make docker-up

# Initialize database
make migration-run
make seed

# Build the project
make build
```

### **2. Verify Infrastructure**

```bash
# Check RabbitMQ is running
make queue-health

# Verify containers are up
docker-compose ps

# Check logs if needed
make docker-logs
```

---

## 🧪 Testing Workflows

### **Scenario 1: Basic Crawl Job Testing**

#### **Step 1: Start Core Services**

```bash
# Terminal 1: Start the crawler consumer
make start-crawler

# Terminal 2: Start the API gateway  
make start-api
```

You should see:
- Crawler service connecting to RabbitMQ queues
- API Gateway starting on http://localhost:3000
- Database connections established

#### **Step 2: Schedule a Crawl Job**

```bash
# Schedule a full crawl for source ID 1
curl -X POST http://localhost:3000/crawler/schedule/full-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": 1,
    "maxPages": 2,
    "priority": 1
  }'
```

Expected response:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "scheduled",
  "message": "Full crawl job scheduled for source 1"
}
```

#### **Step 3: Monitor Job Processing**

```bash
# Check job status
curl http://localhost:3000/crawler/jobs/{jobId}

# Monitor crawler service logs in Terminal 1
# Look for: "Processing crawl job {jobId} - Type: full_crawl"
```

#### **Step 4: Verify Results**

```bash
# Check if anime data was created
curl http://localhost:3000/anime?limit=5

# Check source health status
curl http://localhost:3000/crawler/sources/1/health
```

### **Scenario 2: Complete Microservice Stack Testing**

#### **Step 1: Start All Services**

```bash
# Use separate terminals for each service
make start-crawler     # Terminal 1
make start-api         # Terminal 2  
make start-scheduler   # Terminal 3
make start-analytics   # Terminal 4
make start-notification # Terminal 5
```

#### **Step 2: Test Service Communication**

```bash
# Test API Gateway → Crawler communication
curl -X POST http://localhost:3000/crawler/schedule/update-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": 0,
    "olderThanHours": 24
  }'

# Test Analytics service
curl -X POST http://localhost:3000/analytics/track/view \
  -H "Content-Type: application/json" \
  -d '{
    "animeId": 1,
    "userId": "test-user",
    "sessionId": "test-session"
  }'

# Test Notification service
curl -X POST http://localhost:3000/notification/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "discord",
    "message": "Test notification from HOW_TO guide"
  }'
```

#### **Step 3: Monitor Queue Activity**

Open RabbitMQ Management UI:
```bash
open http://localhost:15672
# Login: guest/guest
```

Check these queues:
- `crawl.queue` - Crawler jobs
- `analytics.queue` - Analytics events  
- `notification.queue` - Notification messages
- `nime.dlx` - Dead letter queue for failed jobs

### **Scenario 3: Error Handling & Retry Testing**

#### **Step 1: Test Invalid Source**

```bash
# Schedule crawl for non-existent source
curl -X POST http://localhost:3000/crawler/schedule/full-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": 999,
    "maxPages": 1
  }'
```

#### **Step 2: Monitor Retry Behavior**

Watch crawler logs for:
- Initial failure message
- Retry scheduling with exponential backoff
- Final failure after max retries
- Dead letter queue routing

#### **Step 3: Verify Dead Letter Queue**

Check RabbitMQ management UI for jobs in `nime.dlx` queue.

---

## 🔧 Development Workflows

### **Adding a New Source**

1. **Insert source configuration:**
```sql
INSERT INTO sources (name, slug, base_url, selectors, is_active, priority, delay_ms) 
VALUES (
  'Test Source',
  'test-source', 
  'https://example.com',
  '{"animeList": ".anime-item", "title": ".title", "sourceId": "@data-id", "sourceUrl": "a@href"}',
  true,
  5,
  2000
);
```

2. **Test the new source:**
```bash
curl -X POST http://localhost:3000/crawler/schedule/full-crawl \
  -H "Content-Type: application/json" \
  -d '{"sourceId": {NEW_SOURCE_ID}, "maxPages": 1}'
```

### **Testing Scraper Logic**

1. **Unit test the scraper:**
```bash
make test-crawler
```

2. **Test specific scraper methods:**
```bash
# Run only scraper tests
yarn test --testPathPattern="anime-scraper.service"
```

### **Queue Job Development**

1. **Create custom job producer:**
```typescript
// Example: Schedule custom health check
await this.crawlJobProducer.scheduleJob({
  type: CrawlJobType.HEALTH_CHECK,
  sourceId: 1,
  priority: QueueJobPriority.HIGH
});
```

2. **Test job processing:**
```bash
# Monitor job execution
make start-crawler

# Check job metrics
curl http://localhost:3000/crawler/queue/metrics
```

---

## 🔍 Debugging & Troubleshooting

### **Common Issues**

#### **RabbitMQ Connection Failed**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq

# Check connection
make queue-health
```

#### **Database Connection Error**
```bash
# Check MySQL status
docker ps | grep mysql

# Verify database exists
docker exec -it nime-mysql mysql -u root -p -e "SHOW DATABASES;"

# Run migrations
make migration-run
```

#### **Crawler Not Processing Jobs**
```bash
# Check crawler logs for connection issues
make start-crawler

# Verify queue exists in RabbitMQ management UI
open http://localhost:15672

# Check if jobs are being produced
curl -X POST http://localhost:3000/crawler/schedule/health-check \
  -H "Content-Type: application/json" \
  -d '{"sourceId": 1}'
```

### **Debug Mode**

Start services with debug logging:
```bash
DEBUG=* make start-crawler
DEBUG=* make start-api
```

### **Database Inspection**

```bash
# Connect to MySQL container
docker exec -it nime-mysql mysql -u root -p

# Check recent crawl jobs
SELECT * FROM crawl_jobs ORDER BY created_at DESC LIMIT 10;

# Check anime data
SELECT id, title, source_id, created_at FROM anime ORDER BY created_at DESC LIMIT 5;

# Monitor source health
SELECT * FROM source_health ORDER BY checked_at DESC LIMIT 10;
```

---

## 📊 Performance Testing

### **Load Testing API Endpoints**

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API Gateway throughput
ab -n 100 -c 10 http://localhost:3000/anime?limit=10

# Test job scheduling endpoint
ab -n 50 -c 5 -p post_data.json -T application/json \
   http://localhost:3000/crawler/schedule/health-check
```

### **Queue Performance Testing**

```bash
# Schedule multiple jobs rapidly
for i in {1..20}; do
  curl -X POST http://localhost:3000/crawler/schedule/health-check \
    -H "Content-Type: application/json" \
    -d "{\"sourceId\": $((i % 5 + 1))}"
done

# Monitor processing times in crawler logs
# Check queue depth in RabbitMQ management UI
```

---

## 🚢 Production Testing

### **Docker Compose Production Stack**

```bash
# Start full production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check all services are healthy
docker-compose ps

# Test load balancer
curl http://localhost/health

# Monitor with Grafana
open http://localhost:3001
```

### **Environment Variables Setup**

```bash
# Copy environment template
cp .env.example .env

# Configure required variables
export DATABASE_HOST=localhost
export RABBITMQ_URL=amqp://localhost:5672
export REDIS_HOST=localhost

# Test configuration
make start-api
```

---

## 🎯 Testing Checklist

### **Development Environment**
- [ ] Infrastructure containers running
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] API Gateway responsive
- [ ] Crawler consumer connected
- [ ] RabbitMQ queues created

### **Basic Functionality**
- [ ] Can schedule crawl jobs via API
- [ ] Jobs are processed by crawler
- [ ] Anime data saved to database
- [ ] Source health monitoring works
- [ ] Error handling and retries function

### **Advanced Features**
- [ ] Multi-source crawling works
- [ ] Queue prioritization respected
- [ ] Dead letter queue captures failures
- [ ] Analytics events tracked
- [ ] Notifications sent successfully

### **Performance & Reliability**
- [ ] Queue processing under load
- [ ] Database query performance
- [ ] Memory usage reasonable
- [ ] No memory leaks detected
- [ ] Proper error logging

---

## 📞 Getting Help

### **Logs & Debugging**
```bash
# Service-specific logs
make start-crawler 2>&1 | tee crawler.log
make start-api 2>&1 | tee api.log

# Infrastructure logs
make docker-logs

# Test coverage reports
make test-coverage
open coverage/lcov-report/index.html
```

### **Useful Commands Reference**

| Task | Command |
|------|---------|
| Quick dev setup | `make dev-setup` |
| Reset environment | `make dev-reset` |
| Test all services | `make test` |
| Check code quality | `make lint && make format` |
| Production build | `make prod-build` |

### **Architecture Diagrams**

Refer to the main README.md for detailed architecture diagrams and service interaction flows.

---

**Happy Testing! 🎉**

For issues or questions, check the troubleshooting section above or refer to individual service documentation in their respective `apps/` directories.