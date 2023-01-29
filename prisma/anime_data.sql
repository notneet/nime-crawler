-- MySQL dump 10.13  Distrib 8.0.31, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: anime_data
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `anime_source_UN` (`url`),
  KEY `anime_source_n_status_IDX` (`n_status`) USING BTREE,
  KEY `anime_source_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Index of list anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anime_source`
--

LOCK TABLES `anime_source` WRITE;
/*!40000 ALTER TABLE `anime_source` DISABLE KEYS */;
INSERT INTO `anime_source` VALUES (1,1,'https://otakudesu.is/anime-list/',45,'2022-09-11 04:24:06','2022-09-11 04:24:06',1,NULL,'2023-01-20 07:16:42',45,10,10,'id','id'),(2,2,'https://194.163.183.129/a-z/',30,'2022-09-11 10:53:45','2022-09-11 11:14:36',1,NULL,'2023-01-20 07:16:42',45,10,10,NULL,NULL),(15,3,'https://google.com',20,'2023-01-21 03:14:11','2023-01-21 03:24:26',0,'2023-01-21 10:12:43','2023-01-21 03:14:11',30,10,10,'id','id'),(33,3,'https://google.co.my',25,'2023-01-21 05:10:06','2023-01-21 05:10:06',0,'2023-01-21 10:12:43','2023-01-21 05:10:06',25,25,25,'my','ms');
/*!40000 ALTER TABLE `anime_source` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '' COMMENT 'Name of web',
  `url` varchar(100) NOT NULL COMMENT 'Domain of web',
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_UN` (`url`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List all available media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT INTO `media` VALUES (1,'Otakudesu','otakudesu.is');
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_detail_pattern`
--

DROP TABLE IF EXISTS `post_detail_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_detail_pattern` (
  `id` int NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `pattern` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `n_status` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `episode_pattern` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_detail_pattern_UN` (`media_id`),
  KEY `post_detail_pattern_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Get data from detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_detail_pattern`
--

LOCK TABLES `post_detail_pattern` WRITE;
/*!40000 ALTER TABLE `post_detail_pattern` DISABLE KEYS */;
INSERT INTO `post_detail_pattern` VALUES (5,1,'[{\"key\":\"LINK_TITLE\",\"pattern\":\"//title\",\"pipe\":[{\"type\":\"regex-replace\",\"regex\":\"(\\\\s)\",\"text_replacement\":\"_\",\"flag\":\"g\"}]}]',1,'2023-01-21 13:32:28','2023-01-21 13:32:28','[{\"key\":\"PAGINATION\",\"node_pattern\":\"//ul/li\",\"label_pattern\":\"./text()\",\"link_pattern\":\"./@href\"}]');
/*!40000 ALTER TABLE `post_detail_pattern` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_pattern`
--

DROP TABLE IF EXISTS `post_pattern`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Get data from index of list anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_pattern`
--

LOCK TABLES `post_pattern` WRITE;
/*!40000 ALTER TABLE `post_pattern` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_pattern` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stream_media_id`
--

DROP TABLE IF EXISTS `stream_media_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stream_media_id` (
  `id` int NOT NULL AUTO_INCREMENT,
  `watch_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Get from watch_media_id.object_id',
  `author` varchar(128) DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `published_ts` timestamp NULL DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL COMMENT 'Name of file hosting',
  `url` varchar(512) DEFAULT NULL COMMENT 'Link download episode',
  `quality` varchar(100) DEFAULT NULL,
  `file_size` varchar(100) DEFAULT NULL,
  `media_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `num_episode` int unsigned DEFAULT NULL,
  `object_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_media_id_object_UN` (`object_id`),
  UNIQUE KEY `stream_media_id_UN` (`url`),
  KEY `stream_media_id_file_size_IDX` (`file_size`) USING BTREE,
  KEY `stream_media_id_author_IDX` (`author`) USING BTREE,
  KEY `stream_media_id_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='List download link for each anime in media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stream_media_id`
--

LOCK TABLES `stream_media_id` WRITE;
/*!40000 ALTER TABLE `stream_media_id` DISABLE KEYS */;
INSERT INTO `stream_media_id` VALUES (3,'b4c9313d8eebaa9468ebf75ca1562a93','','2023-01-21 21:53:24','2023-01-21 21:53:24','','','','',1,'2023-01-21 16:34:45','2023-01-21 16:34:45',1,'d41d8cd98f00b204e9800998ecf8427e');
/*!40000 ALTER TABLE `stream_media_id` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watch_media_id`
--

DROP TABLE IF EXISTS `watch_media_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `watch_media_id` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` varchar(128) NOT NULL COMMENT 'Normalized URL',
  `title` varchar(128) DEFAULT '',
  `title_jp` varchar(128) DEFAULT '' COMMENT 'Alternative anime title on japanese',
  `title_en` varchar(128) DEFAULT '' COMMENT 'Alternative anime title on english',
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT 'Anime type (TV/Movie/BD/OVA/etc))',
  `score` decimal(3,2) DEFAULT '0.00',
  `status` varchar(12) DEFAULT NULL COMMENT 'Should be Ongoing/Completed',
  `duration` int unsigned DEFAULT NULL COMMENT 'duration in minute',
  `total_episode` smallint unsigned DEFAULT '0',
  `published` datetime DEFAULT '1970-01-01 00:00:00',
  `published_ts` timestamp NULL DEFAULT NULL,
  `season` varchar(100) DEFAULT NULL,
  `genres` varchar(128) DEFAULT NULL,
  `producers` varchar(128) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `cover_url` varchar(100) DEFAULT NULL,
  `media_id` int NOT NULL,
  `object_id` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `watch_media_id_UN` (`url`),
  UNIQUE KEY `watch_media_id_UNN` (`object_id`),
  KEY `stream_media_id_status_IDX` (`status`) USING BTREE,
  KEY `stream_media_id_score_IDX` (`score`) USING BTREE,
  KEY `stream_media_id_duration_IDX` (`duration`) USING BTREE,
  KEY `watch_media_id_media_id_IDX` (`media_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store the detail anime';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watch_media_id`
--

LOCK TABLES `watch_media_id` WRITE;
/*!40000 ALTER TABLE `watch_media_id` DISABLE KEYS */;
INSERT INTO `watch_media_id` VALUES (1,'https://example.com/watch/12','','','','',9.50,'',30,12,'2023-01-21 21:53:24','2023-01-21 21:53:24','','','','','2023-01-21 15:13:06','2023-01-21 15:13:06','',1,'b4c9313d8eebaa9468ebf75ca1562a93');
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

-- Dump completed on 2023-01-29 21:00:10
