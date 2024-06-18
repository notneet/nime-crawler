-- MariaDB dump 10.19  Distrib 10.5.23-MariaDB, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: anime_data
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anime_source`
--

DROP TABLE IF EXISTS `anime_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `anime_source` (
  `id` int NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'URL of anime list',
  `interval` smallint unsigned NOT NULL DEFAULT '45',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `n_status` tinyint NOT NULL DEFAULT '0',
  `last_crawled` timestamp NULL DEFAULT NULL,
  `last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `timeout` int unsigned NOT NULL DEFAULT '45',
  `max_itterate_post` int NOT NULL DEFAULT '10',
  `max_itterate_detail` int NOT NULL DEFAULT '10',
  `lang_code` varchar(5) DEFAULT NULL,
  `country_code` varchar(5) DEFAULT NULL,
  `engine` varchar(10) NOT NULL,
  `provide_batch` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `anime_source_UN` (`url`),
  KEY `anime_source_n_status_IDX` (`n_status`) USING BTREE,
  KEY `anime_source_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Index of list anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anime_source`
--

LOCK TABLES `anime_source` WRITE;
/*!40000 ALTER TABLE `anime_source` DISABLE KEYS */;
INSERT INTO `anime_source` VALUES (1,1,'https://otakudesu.cloud/anime-list/',720,'2022-09-11 04:24:06','2024-06-18 02:44:02',1,NULL,'2023-01-20 07:16:42',45,10,10,'id','id','html',1),(40,2,'https://kusonime.com/list-anime-batch-sub-indo/',720,'2023-02-08 03:59:13','2024-06-18 02:44:03',1,NULL,'2023-02-08 03:59:13',45,10,10,'id','id','html',1);
/*!40000 ALTER TABLE `anime_source` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_episode_monitor`
--

DROP TABLE IF EXISTS `job_episode_monitor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_episode_monitor` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `anime_object_id` varchar(128) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `n_status` tinyint(1) NOT NULL DEFAULT '0',
  `video_resolution` int unsigned DEFAULT '480',
  `is_batch` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_episode_monitor_UN` (`anime_object_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List job for monitor anime episode (TBD)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_episode_monitor`
--

LOCK TABLES `job_episode_monitor` WRITE;
/*!40000 ALTER TABLE `job_episode_monitor` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_episode_monitor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '' COMMENT 'Name of web',
  `url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Domain of web, if url has exp cert. Current url will store to url_old. and use new url',
  `url_old` varchar(100) DEFAULT NULL COMMENT 'Domain of web',
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_UN` (`url`),
  UNIQUE KEY `media_url_old_UN` (`url_old`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List all available media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT INTO `media` VALUES (1,'Otakudesu','otakudesu.cloud','otakudesu.txt'),(2,'Kusonime','kusonime.com',NULL),(3,'NontonAnimeID','nontonanimeid.cyou',NULL),(4,'Animebatch','animebatch.id',NULL);
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_detail_pattern`
--

DROP TABLE IF EXISTS `post_detail_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_detail_pattern` (
  `id` int NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `pattern` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `n_status` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pagination_pattern` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_detail_pattern_UN` (`media_id`),
  KEY `post_detail_pattern_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Get data from detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_detail_pattern`
--

LOCK TABLES `post_detail_pattern` WRITE;
/*!40000 ALTER TABLE `post_detail_pattern` DISABLE KEYS */;
INSERT INTO `post_detail_pattern` VALUES (5,1,'[{\"key\":\"POST_CONTAINER\",\"pattern\":\"//div[@class=\'venser\']\",\"result_type\":null,\"options\":{\"alt_pattern\":null,\"batch_in_detail\":false}},{\"key\":\"POST_TITLE\",\"pattern\":\"./div[@class=\'jdlrx\']/h1/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_TITLE_JP\",\"pattern\":\".//div[@class=\'infozingle\']/p[2]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_TITLE_EN\",\"pattern\":\".//div[@class=\'infozingle\']/p[1]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_TYPE\",\"pattern\":\".//div[@class=\'infozingle\']/p[5]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_SCORE\",\"pattern\":\".//div[@class=\'infozingle\']/p[3]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_STATUS\",\"pattern\":\".//div[@class=\'infozingle\']/p[6]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_DURATION\",\"pattern\":\".//div[@class=\'infozingle\']/p[8]/span/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-extraction\",\"regex\":\"\\\\d+\",\"scope\":\"g\"},{\"type\":\"num-normalize\"}]},{\"key\":\"POST_TOTAL_EPISODE\",\"pattern\":\".//div[@class=\'infozingle\']/p[7]/span/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-extraction\",\"regex\":\"\\\\d+\",\"scope\":\"g\"},{\"type\":\"num-normalize\"}]},{\"key\":\"POST_SEASON\",\"pattern\":\"\",\"result_type\":null},{\"key\":\"POST_GENRES\",\"pattern\":\".//div[@class=\'infozingle\']/p[11]/span/a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_PRODUCERS\",\"pattern\":\".//div[@class=\'infozingle\']/p[4]/span/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_DESCRIPTION\",\"pattern\":\".//div[@class=\'sinopc\']/p/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_COVER\",\"pattern\":\".//div[@class=\'fotoanime\']/img/@src\",\"result_type\":\"value\"},{\"key\":\"POST_EPISODES\",\"pattern\":\".//div[@class=\'episodelist\'][2]//a/@href\",\"result_type\":\"value\"},{\"key\":\"POST_BATCH\",\"pattern\":\".//div[@class=\'episodelist\'][1]//a/@href\",\"result_type\":\"value\"},{\"key\":\"PUBLISHED_DATE\",\"pattern\":\".//div[@class=\'infozingle\']/p[9]/span/text()[normalize-space()]\",\"pipes\":[{\"type\":\"month-id-translator\"},{\"type\":\"date-format\"}]}]',1,'2023-01-21 13:32:28','2023-01-21 13:32:28','[]'),(6,2,'[{\"key\":\"POST_CONTAINER\",\"pattern\":\"//div[@class=\'venser\']\",\"result_type\":null,\"options\":{\"alt_pattern\":null,\"batch_in_detail\":true}},{\"key\":\"POST_TITLE\",\"pattern\":\"./div[@class=\'post-thumb\']/h1/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_TITLE_JP\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[1]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-replace\",\"regex\":\": \",\"textReplacement\":\"\",\"scope\":\"g\"}]},{\"key\":\"POST_TITLE_EN\",\"pattern\":\"./div[@class=\'post-thumb\']/h1/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_TYPE\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[5]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-replace\",\"regex\":\": \",\"textReplacement\":\"\",\"scope\":\"g\"}]},{\"key\":\"POST_SCORE\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[8]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-replace\",\"regex\":\": \",\"textReplacement\":\"\",\"scope\":\"g\"}]},{\"key\":\"POST_STATUS\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[6]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-replace\",\"regex\":\": \",\"textReplacement\":\"\",\"scope\":\"g\"}]},{\"key\":\"POST_DURATION\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[9]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-extraction\",\"regex\":\"\\\\d+\",\"scope\":\"g\"},{\"type\":\"num-normalize\"}]},{\"key\":\"POST_TOTAL_EPISODE\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[7]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-extraction\",\"regex\":\"\\\\d+\",\"scope\":\"g\"},{\"type\":\"num-normalize\"}]},{\"key\":\"POST_SEASON\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[3]/a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_GENRES\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[2]/a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_PRODUCERS\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/div[@class=\'info\']/p[4]/text()[normalize-space()]\",\"result_type\":\"text\",\"pipes\":[{\"type\":\"regex-replace\",\"regex\":\": \",\"textReplacement\":\"\",\"scope\":\"g\"}]},{\"key\":\"POST_DESCRIPTION\",\"pattern\":\"./div[@class=\'venutama\']/div[@class=\'lexot\']/p/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"POST_COVER\",\"pattern\":\"./div[@class=\'post-thumb\']/img/@src\",\"result_type\":\"value\"},{\"key\":\"POST_EPISODES\",\"pattern\":\"\",\"result_type\":\"value\"},{\"key\":\"POST_BATCH\",\"pattern\":\"\",\"result_type\":\"value\"},{\"key\":\"PUBLISHED_DATE\",\"pattern\":\"//meta[@property=\'article:published_time\']/@content\",\"pipes\":[{\"type\":\"date-format\"}]}]',1,'2023-02-08 03:58:31','2023-02-08 03:58:31','[]');
/*!40000 ALTER TABLE `post_detail_pattern` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_episode_pattern`
--

DROP TABLE IF EXISTS `post_episode_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_episode_pattern` (
  `id` int NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `pattern` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `n_status` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_detail_pattern_UN` (`media_id`),
  KEY `post_detail_pattern_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Get data from detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_episode_pattern`
--

LOCK TABLES `post_episode_pattern` WRITE;
/*!40000 ALTER TABLE `post_episode_pattern` DISABLE KEYS */;
INSERT INTO `post_episode_pattern` VALUES (1,1,'[{\"key\":\"EPISODE_CONTAINER\",\"pattern\":\"//ul[@class=\'m360p\' or @class=\'m480p\' or @class=\'m720p\']\",\"result_type\":null},{\"key\":\"EPISODE_PROVIDER\",\"pattern\":\".//a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"EPISODE_HASH\",\"pattern\":\".//a/@data-content\",\"result_type\":\"value\"},{\"key\":\"BATCH_CONTAINER\",\"pattern\":\"//div[@class=\'batchlink\']/ul\",\"result_type\":null},{\"key\":\"BATCH_AUTHOR\",\"pattern\":\"\",\"result_type\":\"text\"},{\"key\":\"BATCH_TITLE\",\"pattern\":\"./../h4/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_LIST\",\"pattern\":\"./li\",\"result_type\":null},{\"key\":\"BATCH_PROVIDER\",\"pattern\":\"./a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_LINK\",\"pattern\":\"./a/@href\",\"result_type\":\"value\"},{\"key\":\"BATCH_RESOLUTION\",\"pattern\":\"./strong/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_SIZE\",\"pattern\":\"\",\"result_type\":\"text\"},{\"key\":\"BATCH_PUBLISHED_DATE\",\"pattern\":\"\",\"result_type\":\"text\"}]',1,'2024-02-18 08:25:43','2024-02-18 08:25:43'),(2,2,'[{\"key\":\"BATCH_CONTAINER\",\"pattern\":\"//div[@class=\'smokeddlrh\']\",\"result_type\":null},{\"key\":\"BATCH_LIST\",\"pattern\":\"./div[a]\",\"result_type\":null},{\"key\":\"BATCH_AUTHOR\",\"pattern\":\"\",\"result_type\":\"text\"},{\"key\":\"BATCH_TITLE\",\"pattern\":\"./div[1]/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_PROVIDER\",\"pattern\":\"./a/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_LINK\",\"pattern\":\"./a/@href\",\"result_type\":\"value\"},{\"key\":\"BATCH_RESOLUTION\",\"pattern\":\"./strong/text()[normalize-space()]\",\"result_type\":\"text\"},{\"key\":\"BATCH_SIZE\",\"pattern\":\"\",\"result_type\":\"text\"},{\"key\":\"BATCH_PUBLISHED_DATE\",\"pattern\":\"\",\"result_type\":\"text\"}]',1,'2024-02-18 08:25:43','2024-02-18 08:25:43');
/*!40000 ALTER TABLE `post_episode_pattern` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_pattern`
--

DROP TABLE IF EXISTS `post_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_pattern` (
  `id` int NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `pattern` text,
  `pagination_pattern` text,
  `n_status` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_pattern_UN` (`media_id`),
  KEY `post_pattern_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Get data from index of list anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_pattern`
--

LOCK TABLES `post_pattern` WRITE;
/*!40000 ALTER TABLE `post_pattern` DISABLE KEYS */;
INSERT INTO `post_pattern` VALUES (5,1,'[{\"key\":\"CONTAINER\",\"pattern\":\"//div[@id=\'abtext\']\",\"result_type\":null},{\"key\":\"LINK_PATTERN\",\"pattern\":\"./div[@class=\'bariskelom\']//div[@class=\'jdlbar\']//a/@href\",\"result_type\":\"value\"}]','[]',1,'2023-02-06 06:48:06','2023-02-06 06:48:06'),(6,2,'[{\"key\":\"CONTAINER\",\"pattern\":\"//div[@id=\'abtext\']\",\"result_type\":null},{\"key\":\"LINK_PATTERN\",\"pattern\":\"./div[@class=\'bariskelom\']//a/@href\",\"result_type\":\"value\"}]','[{\"key\":\"PAGINATION_PATTERN\",\"pattern\":\"//div[@class=\'wp-pagenavi\']/a[@class=\'nextpostslink\' and last()]/@href\",\"result_type\":\"value\"}]',1,'2023-02-08 03:58:12','2023-02-08 03:58:12');
/*!40000 ALTER TABLE `post_pattern` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stream_1`
--

DROP TABLE IF EXISTS `stream_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stream_1` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `watch_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Get from watch_media_id.object_id',
  `author` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `published_ts` bigint DEFAULT NULL,
  `name` varchar(192) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Name of file hosting',
  `url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Link download episode',
  `providers` json DEFAULT NULL,
  `quality` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `file_size` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `media_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `num_episode` int unsigned DEFAULT NULL,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` enum('video','batch') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_media_id_object_UN` (`object_id`),
  KEY `stream_media_id_author_IDX` (`author`) USING BTREE,
  KEY `stream_media_id_file_size_IDX` (`file_size`) USING BTREE,
  KEY `stream_media_id_media_id_IDX` (`media_id`) USING BTREE,
  KEY `stream_media_id_type_IDX` (`type`) USING BTREE,
  KEY `stream_media_id_UN` (`url`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List download link for each anime in media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stream_1`
--

LOCK TABLES `stream_1` WRITE;
/*!40000 ALTER TABLE `stream_1` DISABLE KEYS */;
/*!40000 ALTER TABLE `stream_1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stream_2`
--

DROP TABLE IF EXISTS `stream_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stream_2` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `watch_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Get from watch_media_id.object_id',
  `author` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `published_ts` bigint DEFAULT NULL,
  `name` varchar(192) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Name of file hosting',
  `url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Link download episode',
  `providers` json DEFAULT NULL,
  `quality` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `file_size` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `media_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `num_episode` int unsigned DEFAULT NULL,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` enum('video','batch') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_media_id_object_UN` (`object_id`),
  UNIQUE KEY `stream_media_id_UN` (`url`),
  KEY `stream_media_id_author_IDX` (`author`) USING BTREE,
  KEY `stream_media_id_file_size_IDX` (`file_size`) USING BTREE,
  KEY `stream_media_id_media_id_IDX` (`media_id`) USING BTREE,
  KEY `stream_media_id_type_IDX` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List download link for each anime in media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stream_2`
--

LOCK TABLES `stream_2` WRITE;
/*!40000 ALTER TABLE `stream_2` DISABLE KEYS */;
/*!40000 ALTER TABLE `stream_2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stream_media_id`
--

DROP TABLE IF EXISTS `stream_media_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stream_media_id` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `watch_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Get from watch_media_id.object_id',
  `author` varchar(128) DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `published_ts` bigint DEFAULT NULL,
  `name` varchar(192) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Name of file hosting',
  `url` varchar(512) DEFAULT NULL COMMENT 'Link download episode',
  `providers` json DEFAULT NULL,
  `quality` varchar(100) DEFAULT NULL,
  `file_size` varchar(100) DEFAULT NULL,
  `media_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `num_episode` int unsigned DEFAULT NULL,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` enum('video','batch') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_media_id_object_UN` (`object_id`),
  UNIQUE KEY `stream_media_id_UN` (`url`),
  KEY `stream_media_id_file_size_IDX` (`file_size`) USING BTREE,
  KEY `stream_media_id_author_IDX` (`author`) USING BTREE,
  KEY `stream_media_id_media_id_IDX` (`media_id`) USING BTREE,
  KEY `stream_media_id_type_IDX` (`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List download link for each anime in media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stream_media_id`
--

LOCK TABLES `stream_media_id` WRITE;
/*!40000 ALTER TABLE `stream_media_id` DISABLE KEYS */;
INSERT INTO `stream_media_id` VALUES (3,'b4c9313d8eebaa9468ebf75ca1562a93','','2023-01-21 21:53:24',20230121215324,'','',NULL,'','',1,'2023-01-21 16:34:45','2023-01-21 16:34:45',1,'d41d8cd98f00b204e9800998ecf8427e','video');
/*!40000 ALTER TABLE `stream_media_id` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `n_status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_IDX` (`username`) USING BTREE,
  KEY `users_role_IDX` (`role`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Credential user internal dashboard';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Hanivan','hanivanrizky','$2b$10$mQS8sb.NwAwHxRNkMpYgc.EuWARn9ICtArYGeOsPDxYO7Dl6bRhTC','admin',1,'2024-01-13 09:26:30','2024-01-13 09:26:30',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watch_1`
--

DROP TABLE IF EXISTS `watch_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `watch_1` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `media_id` int NOT NULL,
  `url` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Normalized URL',
  `title` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `title_jp` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on japanese',
  `title_en` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on english',
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Anime type (TV/Movie/BD/OVA/etc))',
  `score` decimal(3,2) DEFAULT '0.00',
  `status` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Should be Ongoing/Completed',
  `duration` int unsigned DEFAULT NULL COMMENT 'duration in minute',
  `total_episode` int unsigned DEFAULT '0',
  `published` datetime DEFAULT '1970-01-01 00:00:00',
  `published_ts` bigint DEFAULT NULL,
  `season` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `genres` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `producers` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `cover_url` varchar(192) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `watch_media_id_UN` (`url`),
  UNIQUE KEY `watch_media_id_UNN` (`object_id`),
  KEY `stream_media_id_duration_IDX` (`duration`) USING BTREE,
  KEY `stream_media_id_score_IDX` (`score`) USING BTREE,
  KEY `stream_media_id_status_IDX` (`status`) USING BTREE,
  KEY `watch_media_id_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store the detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watch_1`
--

LOCK TABLES `watch_1` WRITE;
/*!40000 ALTER TABLE `watch_1` DISABLE KEYS */;
/*!40000 ALTER TABLE `watch_1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watch_2`
--

DROP TABLE IF EXISTS `watch_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `watch_2` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `media_id` int NOT NULL,
  `url` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Normalized URL',
  `title` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `title_jp` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on japanese',
  `title_en` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on english',
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Anime type (TV/Movie/BD/OVA/etc))',
  `score` decimal(3,2) DEFAULT '0.00',
  `status` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Should be Ongoing/Completed',
  `duration` int unsigned DEFAULT NULL COMMENT 'duration in minute',
  `total_episode` int unsigned DEFAULT '0',
  `published` datetime DEFAULT '1970-01-01 00:00:00',
  `published_ts` bigint DEFAULT NULL,
  `season` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `genres` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `producers` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `cover_url` varchar(192) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `watch_media_id_UN` (`url`),
  UNIQUE KEY `watch_media_id_UNN` (`object_id`),
  KEY `stream_media_id_duration_IDX` (`duration`) USING BTREE,
  KEY `stream_media_id_score_IDX` (`score`) USING BTREE,
  KEY `stream_media_id_status_IDX` (`status`) USING BTREE,
  KEY `watch_media_id_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store the detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watch_2`
--

LOCK TABLES `watch_2` WRITE;
/*!40000 ALTER TABLE `watch_2` DISABLE KEYS */;
/*!40000 ALTER TABLE `watch_2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watch_media_id`
--

DROP TABLE IF EXISTS `watch_media_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `watch_media_id` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `object_id` varchar(128) DEFAULT NULL,
  `media_id` int NOT NULL,
  `url` varchar(128) NOT NULL COMMENT 'Normalized URL',
  `title` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `title_jp` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on japanese',
  `title_en` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Alternative anime title on english',
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Anime type (TV/Movie/BD/OVA/etc))',
  `score` decimal(3,2) DEFAULT '0.00',
  `status` varchar(12) DEFAULT NULL COMMENT 'Should be Ongoing/Completed',
  `duration` int unsigned DEFAULT NULL COMMENT 'duration in minute',
  `total_episode` int unsigned DEFAULT '0',
  `published` datetime DEFAULT '1970-01-01 00:00:00',
  `published_ts` bigint DEFAULT NULL,
  `season` varchar(100) DEFAULT NULL,
  `genres` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `producers` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `cover_url` varchar(192) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `watch_media_id_UN` (`url`),
  UNIQUE KEY `watch_media_id_UNN` (`object_id`),
  KEY `stream_media_id_status_IDX` (`status`) USING BTREE,
  KEY `stream_media_id_score_IDX` (`score`) USING BTREE,
  KEY `stream_media_id_duration_IDX` (`duration`) USING BTREE,
  KEY `watch_media_id_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store the detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watch_media_id`
--

LOCK TABLES `watch_media_id` WRITE;
/*!40000 ALTER TABLE `watch_media_id` DISABLE KEYS */;
/*!40000 ALTER TABLE `watch_media_id` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-18  9:47:58
