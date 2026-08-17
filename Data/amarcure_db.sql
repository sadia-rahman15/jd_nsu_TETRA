-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 30, 2026 at 04:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `amarcure_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `email_verification_codes`
--

CREATE TABLE `email_verification_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `code_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_verification_codes`
--

INSERT INTO `email_verification_codes` (`id`, `user_id`, `code_hash`, `expires_at`, `used_at`, `attempts`, `created_at`) VALUES
(1, 2, '0f96af58a9379af1ce46a1fe7f7c5d53cc52cf50214398c7d70b63dde48a8476', '2026-07-27 08:17:48', '2026-07-27 08:08:26', 0, '2026-07-27 02:07:48');

-- --------------------------------------------------------

--
-- Table structure for table `medical_reports`
--

CREATE TABLE `medical_reports` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) DEFAULT NULL,
  `storage_key` varchar(700) DEFAULT NULL,
  `mime_type` varchar(150) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `share_token` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_codes`
--

CREATE TABLE `password_reset_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `code_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_codes`
--

INSERT INTO `password_reset_codes` (`id`, `user_id`, `code_hash`, `expires_at`, `used_at`, `attempts`, `created_at`) VALUES
(1, 2, '07bc281b8520a179570bf5d000ee1004f47bd816502ebc95926519265e81f788', '2026-07-27 08:24:09', NULL, 0, '2026-07-27 02:14:09');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `public_blood_donors`
--

CREATE TABLE `public_blood_donors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_row` int(11) NOT NULL,
  `donor_name` varchar(255) NOT NULL,
  `blood_group_raw` varchar(80) DEFAULT NULL,
  `blood_group_normalized` varchar(4) DEFAULT NULL,
  `phone_raw` varchar(50) DEFAULT NULL,
  `phone_normalized` varchar(20) DEFAULT NULL,
  `location_text` varchar(500) DEFAULT NULL,
  `source_name` varchar(180) NOT NULL,
  `source_url` varchar(700) NOT NULL,
  `imported_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `public_blood_donors`
--

INSERT INTO `public_blood_donors` (`id`, `source_row`, `donor_name`, `blood_group_raw`, `blood_group_normalized`, `phone_raw`, `phone_normalized`, `location_text`, `source_name`, `source_url`, `imported_at`) VALUES
(1, 0, 'Md Shahidul Islam', 'O+', 'O+', '01400486272', '01400486272', 'Mirpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(2, 1, 'Sakib Chowdhury', 'B+', 'B+', '01521205218', '01521205218', 'নারায়ণগঞ্জ', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(3, 2, 'পলাশ', 'O+', 'O+', '01674429371', '01674429371', 'Notun bazar', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(4, 3, 'খান ইয়াছির আরাফাত', 'B+', 'B+', '01684405076', '01684405076', 'Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(5, 4, 'Raisul Islam', 'A+', 'A+', '01892974019', '01892974019', 'Feni', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(6, 5, 'Uzzal Howlader', 'O+', 'O+', '01306991645', '01306991645', 'Sector -5, Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(7, 6, 'Nayim', 'A+', 'A+', '1798333014', '01798333014', 'BGMEA University', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(8, 7, 'Fazle Rabbi', 'O+ve', 'O+', '01843615359', '01843615359', 'Uttara Housebuilding', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(9, 8, 'Md. Tarikul Islam', 'O+', 'O+', '1722589181', '01722589181', 'Kazipara, Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(10, 9, 'MD RAKIB Hossain', 'A-(negative)', 'A-', '01783972901', '01783972901', 'Mirpur-', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(11, 10, '10 Nafiun yesin bijoy', 'B(+)', 'B+', '01319529792', '01319529792', 'Shewrapara Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(12, 11, 'আজিজ', 'ও+', 'O+', '01324419829', '01324419829', 'উত্তরা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(13, 12, 'Mozammel', 'O positive', 'O+', '01674880062', '01674880062', 'Mirpur-1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(14, 13, 'Aritra Halder', 'O+', 'O+', '01319726361', '01319726361', 'Mohammodpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(15, 14, 'Amit Hassan', 'B+', 'B+', '01309280606', '01309280606', 'Uttara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(16, 15, 'Fateha Akter Moontaha', 'B+', 'B+', '01558397769', '01558397769', 'IUT, Boardbazar, Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(17, 16, 'Sofana', 'A+', 'A+', '01783020070', '01783020070', 'Bashundhara R/A, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(18, 17, 'Tarun O', '(-)', NULL, '01839829521', '01839829521', 'বাড্ডা, লিংক রোড, ঢাকা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(19, 18, 'Shahidul', 'A+', 'A+', '01744786839', '01744786839', 'UGC office Agargaon Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(20, 19, 'Abdullah Alif', 'B+', 'B+', '01629889764', '01629889764', 'Savar new market, savar , dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(21, 20, 'Yaseen Ahmed', 'B+', 'B+', '01797260270', '01797260270', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(22, 21, 'Artho', 'O+', 'O+', '01795070111', '01795070111', 'Badda', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(23, 22, 'Rumpa das', 'B+', 'B+', '01628492164', '01628492164', 'uttara,', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(24, 23, 'Rafik', 'B+', 'B+', '01518793396', '01518793396', 'Dhaka damra', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(25, 24, 'Md omar', 'O+', 'O+', '01880386078', '01880386078', 'Khilgaon', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(26, 25, 'Safim Sarkar Shohag', 'B negative', 'B-', '01301355156', '01301355156', 'Kuril Biswa road', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(27, 26, 'Sumaiya Chowdhury', 'O+', 'O+', '01966927557', '01966927557', 'Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(28, 27, 'salman akter soinik', 'ab+', 'AB+', '01644161621', '01644161621', 'mirpur 1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(29, 28, 'Ayesha Khatun Muskan', 'O+', 'O+', '01540734454', '01540734454', 'mirpur 6', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(30, 29, 'M.A Masudur Rahman Jehadi', 'A+', 'A+', '01758940102', '01758940102', 'Narayanganj', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(31, 30, 'Hasibul.Alam', 'B+', 'B+', '01726483252', '01726483252', 'Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(32, 31, 'Md jamil hosem', 'A+', 'A+', '01303712742', '01303712742', 'Kathalbagan', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(33, 32, 'Saifur Rahman', 'AB+', 'AB+', '01797246216', '01797246216', 'Uttara Sector 11', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(34, 33, 'Asifur Rahman Riad', 'AB +', 'AB+', '01844884402', '01844884402', 'সাভার,,খাগান,, সিটি ইউনিভার্সিটি', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(35, 34, 'Md Mahmudul Hasan Lalin', 'B+', 'B+', '01613541839', '01613541839', 'Uttara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(36, 35, 'Md Habibur Rahman', 'O+', 'O+', '01861225929', '01861225929', 'Dhaka Medical', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(37, 36, 'Kibria', 'B+', 'B+', '01723545919', '01723545919', 'Kallyanpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(38, 37, 'Mostain', '0+', 'O+', '01720248548', '01720248548', 'Bashundhara R/A', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(39, 38, 'Ratul', 'O+', 'O+', '01733744942', '01733744942', 'Rampura', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(40, 39, 'Mahmuda Dipa', 'A+', 'A+', '01630392094', '01630392094', 'Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(41, 40, 'Masuma mim', 'A+', 'A+', '01765119695', '01765119695', 'Tongi gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(42, 41, 'Azizul hakim', 'O+', 'O+', '01634325958', '01634325958', 'Khilkhet, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(43, 42, 'Jico Shyam', 'B+', 'B+', '+8801686060676', '01686060676', 'Uttara Kamarpara ( will be available after 7.30 PM)', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(44, 43, 'Dipu', 'A-', 'A-', '01858073862', '01858073862', 'Bonosree', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(45, 44, 'Rafi Islam Akash', 'AB+', 'AB+', '01316349596', '01316349596', 'Uttara, House Building', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(46, 45, 'Sohag', 'A+', 'A+', '01700997676', '01700997676', 'Agargaon', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(47, 46, 'Nabil Bin Hossain', 'B+ (B positive)', 'B+', '01934758752', '01934758752', 'Bashabo, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(48, 47, 'Soleman Hossain', 'B+', 'B+', '01306327597', '01306327597', 'basundara,, vatara dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(49, 48, 'BORSHON', 'B+', 'B+', '01733750670', '01733750670', 'NORTH SHAJAHANPUR, DHAKA', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(50, 49, 'Farhan', 'AB negative', 'AB-', '01824655328', '01824655328', 'Tangail', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(51, 50, 'Sadab Reza', 'AB+ve', 'AB+', '01737161616', '01737161616', 'Mirpur DOHS, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(52, 51, 'Rubaiyat Jahan Mihi', 'A+', 'A+', '01755999277', '01755999277', 'Uttara,House building', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(53, 52, 'Sumiya Islam', 'AB+', 'AB+', '01710689033', '01710689033', 'Shaheenbag, Tejgaon, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(54, 53, 'Shafin khan', 'O+', 'O+', '01975507924', '01975507924', 'Dhaka Cantonment', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(55, 54, 'Al Muztahid Mridu', 'A+', 'A+', '01331396680', '01331396680', 'Hatirjheel, Rampura, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(56, 55, 'Ahnaf', 'O+', 'O+', '01629560390', '01629560390', 'Mirpur, diabari', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(57, 56, 'Khaled', 'B+', 'B+', '01841626675', '01841626675', 'Kuril', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(58, 57, 'Hasib Al Masud', 'B+', 'B+', '01955067272', '01955067272', 'Uttara sector 10', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(59, 58, 'Rakib hossain', 'B+', 'B+', '01771935591', '01771935591', 'Mirpur -12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(60, 59, 'Nahid shikto', 'a+', 'A+', '1703205886', '01703205886', 'kuril, dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(61, 60, 'Abdullah', 'B+', 'B+', '01787022398', '01787022398', 'Mirpur DOHS', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(62, 61, 'Md.Shahriar Islam', 'O+', 'O+', '01794241711', '01794241711', 'Mirpur-1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(63, 62, 'Md.Abu Zahid', 'A+', 'A+', '01761202118', '01761202118', 'Mirpur-12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(64, 63, 'Mahbub', 'B+', 'B+', '01688600941', '01688600941', 'Banani', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(65, 64, 'Ruhit Kumar Saha', 'B(+)', 'B+', '01786011378', '01786011378', 'Uttara Sector 9', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(66, 65, 'Shagoto Nath', 'AB+', 'AB+', '01892955046', '01892955046', 'D.T Road ,Pahatoli, Chottogram', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(67, 66, 'Khaled', 'A+', 'A+', '01611011352', '01611011352', 'Uttara sector-13, Road-13', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(68, 67, 'All Hasib Khan', 'B+', 'B+', '01568406491', '01568406491', 'West Rampura', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(69, 68, 'মোহাম্মদ ইমাম হোসেন', 'A+', 'A+', '01762593923', '01762593923', 'নিকেতন, গুলশান -১।', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(70, 69, 'জিনতি', 'AB+', 'AB+', '01715833867', '01715833867', 'Sector 6, Uttara, Dhaka-1230', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(71, 70, 'Most Mostafizur Rahman', 'sojib', NULL, '01796741270', '01796741270', 'Mohammadpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(72, 71, 'Imran Hossain', 'A+', 'A+', '01894177329', '01894177329', 'Bashundhara R/A, M block, Road 8', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(73, 72, 'Fahmid Siyam', 'A-', 'A-', '01540398391', '01540398391', 'Ashuliya', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(74, 73, 'Rumana', 'O positive', 'O+', '01761618896', '01761618896', 'Tongi, Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(75, 74, 'Minhazul Haque Tonmoy', 'O+', 'O+', '01824238143', '01824238143', 'Masterpara, Uttarkhan, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(76, 75, 'Jayad Hossain', 'Ab+', 'AB+', '01923309169', '01923309169', 'Basundhara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(77, 76, 'Shakil A+ ( Have', 'Allergy)', NULL, '01535120716', '01535120716', 'Khilgaon, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(78, 77, 'Alexxx', 'O Positive', 'O+', '01777507574', '01777507574', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(79, 78, 'Meherun Nessa Jerin', 'B+', 'B+', '01322649954', '01322649954', 'Ticatuli - Wari - Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(80, 79, 'মেহেদী হাসান রিফাত', 'বি পজেটিভ', 'B+', '01995876107', '01995876107', 'Mirpur -1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(81, 80, 'Md Shahadat Hossain', 'A+', 'A+', '01712290099', '01712290099', 'Banani, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(82, 81, 'Noor Alam Shawon', 'B+', 'B+', '01841555415', '01841555415', 'Khalpar, Leguna Stand, Robi Sheba, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(83, 82, 'Monir', 'O+', 'O+', '01711131868', '01711131868', 'Mirpur shewra para, dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(84, 83, 'Md Mehedi Hassan', 'O+', 'O+', '01646397931', '01646397931', 'Kazla- Jatrabari -Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(85, 84, 'MD Jobayer', 'A-', 'A-', '01560000547', '01560000547', 'Mohakhali', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(86, 85, 'আহনাফ মাওলা অমি', 'AB+', 'AB+', '01705818210', '01705818210', 'Bashundhara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(87, 86, 'শম্ময়', 'B+', 'B+', '01622085295', '01622085295', 'Badda, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(88, 87, 'Mursalin Abir', '0+', 'O+', '01601274843', '01601274843', 'Shymoli Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(89, 88, 'Md. Touhidul Islam Touhid', 'B+', 'B+', '01723861934', '01723861934', 'Kallayanpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(90, 89, 'পপলু', 'বি পজিটিভ', 'B+', '1893616401', '01893616401', 'বাগেরহাট', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(91, 90, 'Md.Sazzad Hossain', 'B+', 'B+', '01771502468', '01771502468', 'Mipur Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(92, 91, 'জিদান', 'B+ve', 'B+', '1788966080', '01788966080', 'সাভার', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(93, 92, 'Md Muntasir Rahman', 'A+ve', 'A+', '01342439801', '01342439801', 'Armed Police Battalion Complex,Sector 2,Uttara Dhaka 1230', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(94, 93, 'Tauhid Sarker', 'B+', 'B+', '01876598164', '01876598164', 'Kaligonj -Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(95, 94, 'Tahsin Tajwer', 'B+', 'B+', '01841670550', '01841670550', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(96, 95, 'Asaduzzaman Asad', 'A+', 'A+', '01954105268', '01954105268', 'আশুলিয়া', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(97, 96, 'Zulkarnayeen sourov O+', '(positive)', NULL, '01842950235', '01842950235', 'Banani- Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(98, 97, 'Jafrul Hasan', 'O+', 'O+', '01844505428', '01844505428', 'Mirpur Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(99, 98, 'Amzad', 'AB+', 'AB+', '01831616167', '01831616167', 'DHAKA', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(100, 99, 'Asif Khan Pathan', 'B+', 'B+', '01977192050', '01977192050', 'Farmgate. Metro diye aste parbo.', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(101, 100, 'Lutfun Nahar(Rima)', 'O+', 'O+', '01326999869', '01326999869', 'আশুলিয়া, সাধুপারা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(102, 101, 'Asadul Hasan Antor', 'O+', 'O+', '01600125259', '01600125259', 'Rampura, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(103, 102, 'Md mehedi Hasan', 'A+', 'A+', '01571472101', '01571472101', 'Tongi', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(104, 103, 'Md Shishir', 'A+', 'A+', '01778417678', '01778417678', 'Kallayanpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(105, 104, 'Md Hamidul Isla', 'O+(ve)', 'O+', '01738447956', '01738447956', 'Sector 16, Diabari, Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(106, 105, 'ASIF MAHMUD', 'B+', 'B+', '01760165876', '01760165876', 'BUFT Uttara Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(107, 106, 'Shadman Sadique', 'O+', 'O+', '01730576996', '01730576996', 'Bashundhara Residential Area, Vatara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(108, 107, 'Mainul Hasan Emon', 'B+', 'B+', '01683848593', '01683848593', 'Khalpar, Uttara 12, Robi Sheba, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(109, 108, 'Aditta', 'B+', 'B+', '01521435116', '01521435116', 'Tongi Bazar(very close to Uttara), Tongi Thana, Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(110, 109, 'মানাজির হাসান কাফি', 'B+', 'B+', '01686840870', '01686840870', 'Mirpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(111, 110, 'Sadman', 'O-', 'O-', '01720134080', '01720134080', 'আশুলিয়া', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(112, 111, 'Abdullah Bin Khurshid', 'B+', 'B+', '01711774014', '01711774014', 'Bashundhara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(113, 112, 'Raiyan Ahmed', 'B+', 'B+', '01742808277', '01742808277', 'Mirpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(114, 113, 'Fardin Ahasan Mahi', 'Ab+', 'AB+', '01893034056', '01893034056', 'Green road,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(115, 114, 'Atika Orthee', 'O +ve', 'O+', '01892816259', '01892816259', 'Uttara sector 1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(116, 115, 'Rokib Ul Aziz', 'AB+', 'AB+', '1537649682', '01537649682', 'mirpur 10', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(117, 116, 'Yasir', 'A+(Positive)', 'A+', '01712315085', '01712315085', 'DUET, Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(118, 117, 'সৌরভ', 'B+', 'B+', '01310723684', '01310723684', 'Uttara sector 9', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(119, 118, 'Asif', 'A+', 'A+', '01339700821', '01339700821', 'Khilgaon', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(120, 119, 'সোলাইমান কবির', 'বি+', 'B+', '1609309036', '01609309036', 'ঢাকা মিরপুর ১২', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(121, 120, 'Jihan Ashfaq Prothom', 'O+', 'O+', '01408770045', '01408770045', 'Khilgaon, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(122, 121, 'সুমাইয়া আক্তার', 'বি -', 'B-', '01779917738', '01779917738', 'Uttara, Sector -6', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(123, 122, 'Shaon', 'O(-)', 'O-', '01687850023', '01687850023', 'Tongi', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(124, 123, 'Ariful Haque', 'B+', 'B+', '01517-855050', '01517855050', 'Chandra', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(125, 124, 'Md. Alamin Hossain', 'B+', 'B+', '01796-498553', '01796498553', 'Kaliakair,Gazipur-1750 But i will be available at Uttara Till 6.00 PM', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(126, 125, 'Md. Nahid Mahamud', 'AB+', 'AB+', '01311461933', '01311461933', 'Gazipur joydebpur(Duet area)', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(127, 126, 'Muhammad Rifath Talukdar', 'O+', 'O+', '01711404212', '01711404212', 'Kazipara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(128, 127, 'MAHBUB', 'O+', 'O+', '01721319963', '01721319963', 'Khilkhet,Khilkhet Thana,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(129, 128, 'Niloy Ahmed', 'AB+', 'AB+', '01628260245', '01628260245', 'Mohammadia Housing Society - Mohammadpur - Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(130, 129, 'Fahad mia', 'O+', 'O+', '+8801608889910', '01608889910', 'Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(131, 130, 'Quazi tafsirul islam', 'O+', 'O+', '01717756454', '01717756454', 'Bakshibazar, Dhaka 1211', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(132, 131, 'Sabbir', 'O+', 'O+', '01725328352', '01725328352', 'Uttara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(133, 132, 'Abid Hasan', 'A+', 'A+', '01314669525', '01314669525', 'Dhaka, KarwanBazar', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(134, 133, 'Sazzad Hossain Rafi', 'B+', 'B+', '01935985869', '01935985869', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(135, 134, 'Omar Radee', 'O+', 'O+', '01752744660', '01752744660', 'Bashundhara R/A, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(136, 135, 'ডি এম রাইয়ান', 'A (-) ve', 'A-', '01760366919', '01760366919', 'Mirpur Cantonment - Pallabi - Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(137, 136, 'Tanvir', 'A+', 'A+', '01614128459', '01614128459', 'Uttara ( will be available after 6 pm there ) currently in office ( Ashulia )', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(138, 137, 'Imran', 'B-', 'B-', '01724012361', '01724012361', 'উওরা ১৮ নম্বর সেক্টর তুরাগ থানা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(139, 138, 'Sojib hossain', 'B+', 'B+', '01571160048', '01571160048', 'Uttara sector 10,ranavola', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(140, 139, 'Raju ahmed', 'B+', 'B+', '01608119541', '01608119541', 'Mirpur mazar road- Darussalam- Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(141, 140, 'Shamim', 'O+', 'O+', '01670606051', '01670606051', 'Agargaon taltola', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(142, 141, 'Md Fahad Bin Neaid', 'O+', 'O+', '01306209364', '01306209364', 'Nakhalpara, Tejgaon, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(143, 142, 'Md Rakhibul Hasan', 'B+', 'B+', '01744610581', '01744610581', 'Kallyanpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(144, 143, 'Md Mehedi Hassan', 'o+', 'O+', '01751508017', '01751508017', 'uttara dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(145, 144, 'Belayet Hossain', 'AB+(positive)', 'AB+', '01880399946. / 01854021104', NULL, 'Polton', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(146, 145, 'হিমু', 'B+', 'B+', '01538305455', '01538305455', 'Shahibag,Chapai nawabganj sadar.. present: mirpur 11 metro ,mohammadiya market', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(147, 146, 'Mahmudur Rahman', 'B+', 'B+', '01779051101', '01779051101', 'Dhaka Uddan - Mohammadpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(148, 147, 'খালিদ', 'বি পজিটিভ', 'B+', '1770001664', '01770001664', 'গাজীপুর', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(149, 148, 'Tanvin ahmed', 'B+', 'B+', '01647503321', '01647503321', 'Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(150, 149, 'Zawad Abdullah', 'O positive', 'O+', '01304733449', '01304733449', 'Mirpur DOHS, Pallabi, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(151, 150, 'Sakib Al Hasan', 'B+', 'B+', '01642108908', '01642108908', 'KAPASIA, GAZIPUR ( Current - Mirpur 12 )', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(152, 151, 'Md. Miraj Hossain', 'B+Ve', 'B+', '01521572418', '01521572418', 'Rampura', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(153, 152, 'Kamrul shah', 'B+', 'B+', '01516573629', '01516573629', 'Tongi,, College gate', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(154, 153, 'Arafat Hossen Apon', 'B+', 'B+', '01707474881', '01707474881', 'নিকুঞ্জ-২, খিলখেত, ঢাকা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(155, 154, 'Raisa', 'A+', 'A+', '01975518793', '01975518793', 'Uttara- Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(156, 155, 'মো: বায়েজিদ খান', 'B+', 'B+', '01905118939', '01905118939', 'Mirpur 12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(157, 156, 'Ashikul Islam', 'B-', 'B-', '01611748982', '01611748982', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(158, 157, 'Mokter hossain', 'O(+)', 'O+', '01772319433', '01772319433', 'Mirpur-6,pallabi thana,Dahaka-1216', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(159, 158, 'মেহেদী', 'O+', 'O+', '01932248383', '01932248383', 'কাওলা,দক্ষিনখান', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(160, 159, 'Muhammad Shakib', 'O+', 'O+', '01922002126', '01922002126', 'Daffodil International university', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(161, 160, 'Ahnaf Afique', 'A+', 'A+', '01828195590', '01828195590', 'Shewrapara, Mirpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(162, 161, 'Emu', 'B(-)B Negative', 'B-', '01832808578/01904446070', NULL, 'Mirpur-12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(163, 162, 'নুর আমিন', 'O +', 'O+', '01749183511', '01749183511', 'farmgate Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(164, 163, 'Toimur Shahriar', 'B+', 'B+', '01959172601', '01959172601', 'Mirpur 12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(165, 164, 'পলাশ', 'AB+', 'AB+', '01409036198', '01409036198', 'টংগী', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(166, 165, 'Sabbira Jahan Moon', 'O+', 'O+', '01712896471', '01712896471', 'Kollyanpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(167, 166, 'Talha', 'A+', 'A+', '01533301784', '01533301784', 'Aftabnagar Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(168, 167, 'Nahian Kabir', 'AB+', 'AB+', '01742727143', '01742727143', 'Chaad Uddan Housing - Mohammadpur 1207 - Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(169, 168, 'Tanvir Hasan Turjoy', 'O+', 'O+', '01405615801', '01405615801', 'Mohakhali, Banani,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(170, 169, 'Nafisa Tabassum', 'O+', 'O+', '01328226552', '01328226552', 'Kallyanpur, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(171, 170, 'Md Reyad Hossain', 'AB+', 'AB+', '01612956408', '01612956408', 'Poribagh, Shahbagh, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(172, 171, 'Maruf Hassain A (-)', 'Negative', NULL, '01774129035', '01774129035', 'Kushtia sadar, Kushtia', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(173, 172, 'Sk Farzana Tasnim Sumona', 'B+', 'B+', '01950839506', '01950839506', 'mohammadpur, Ittadi mor, Katashur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(174, 173, 'MD Tangim Haque', 'A+', 'A+', '01610006484', '01610006484', 'Mirpur DOHS, Mirpur 1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(175, 174, 'Shadman Khalili', 'O+', 'O+', '01735606512', '01735606512', 'Sector 4, Uttara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(176, 175, 'Nahid', 'O+', 'O+', '01820003222', '01820003222', 'Mohammadpur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(177, 176, 'জাবেদুল ইসলাম', 'এ+', 'A+', '01857541875', '01857541875', 'পান্থপথ, ঢাকা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(178, 177, 'Sabbir', 'A+', 'A+', '01841185584', '01841185584', 'Khilkhet,dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(179, 178, 'Sharif Sultan', '0+', 'O+', '01791205961', '01791205961', 'Kawran bazar', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(180, 179, 'Mahbub simanto', 'B+', 'B+', '01617880666', '01617880666', 'Notun Bazar,gulshan, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(181, 180, 'Md. Ashiqul Haider Chowdhury', 'O+ve', 'O+', '01322200257', '01322200257', 'মিরপুর ১০', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(182, 181, 'Simanto chowdhury', 'O +', 'O+', '01708307201', '01708307201', 'Nikunjo 2', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(183, 182, 'Emon', 'B+', 'B+', '01308967144', '01308967144', 'Mirpur 1', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(184, 183, 'Unknown', 'Unknown', NULL, 'Unknown', NULL, 'Unknown', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(185, 184, 'Mohammad Radian Al Mahmmud', 'AB+', 'AB+', '01601127345', '01601127345', 'Modhumita-Tongi-Gazipur', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(186, 185, 'শিহাব', 'B+', 'B+', '+8801318950209', '01318950209', 'নিকুঞ্জ-২, খিলখেত,ঢাকা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(187, 186, 'Saraf', 'B+', 'B+', '01601987532', '01601987532', 'Badda,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(188, 187, 'মোহাম্মদ সাইফ A+', '(positive)', NULL, '01302208182', '01302208182', 'Sayeed Nagar, Vatara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(189, 188, 'Mamun', 'O+', 'O+', '01679897479', '01679897479', 'Dhaka,nikunjo-02', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(190, 189, 'MD Saifullah', 'AB+', 'AB+', '01742849711', '01742849711', 'Mirpur DOHS', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(191, 190, 'Fimoon Sunbi Ridoy', 'A+', 'A+', '01872075608', '01872075608', 'Uttara Sector 11, Uttara Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(192, 191, 'Daud Reza Mahim A+', 'positive', NULL, '01742157984', '01742157984', 'East Rajabazaar,Framgate, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(193, 192, 'S.M.Salah Uddin Kaisar O', '(+ve)', NULL, '01711801369', '01711801369', 'Shaheenbag, West Nakhalpara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(194, 193, 'Pushpita', 'O positive', 'O+', '01632262387', '01632262387', 'Uttara dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(195, 194, 'Shihab', 'B+', 'B+', '01678713712', '01678713712', 'সাভার, ঢাকা', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(196, 195, 'Tarek Rahman', 'AB+', 'AB+', '01601634354', '01601634354', 'Sector 10, Uttara, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(197, 196, 'রফিকুল ইসলাম', 'বি+', 'B+', '1521717059', '01521717059', 'অস্থায়ী বাসস্থান:কুর্মিটোলা পাশে। স্থায়ী :শরীয়তপুর', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(198, 197, 'Md. Imties Ahammed', 'O+', 'O+', '01876882474', '01876882474', 'Demra(Konapara),Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(199, 198, 'Abdullah Al Nisat', 'O+', 'O+', '01772350524', '01772350524', 'Mirpur -2', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(200, 199, 'Khalid Hasan Milu', 'B+', 'B+', '01318160713', '01318160713', 'Hazaribag,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(201, 200, 'Tariqul', 'B+', 'B+', '01773458212', '01773458212', 'Dhanmondi', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(202, 201, 'Md shawon', 'O positive', 'O+', '01825352785', '01825352785', 'Mirpur 11, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(203, 202, 'A.K.M. Sonny Morshad', 'O+', 'O+', '01685718518', '01685718518', 'Shonir Akhra, Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(204, 203, 'Simanto', 'O+', 'O+', '01713750159', '01713750159', 'Uttara', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(205, 204, 'Tasha', 'O+', 'O+', '01731506876', '01731506876', 'Mirpur 13', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(206, 205, 'ফাহিম হাওলাদার', 'B+', 'B+', '01786128717', '01786128717', '১২৪/৪ শান্তিনগর', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(207, 206, 'Abdul Aziz', 'A-', 'A-', '01522140941', '01522140941', 'Mirpur 12', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(208, 207, 'Kaynath Sharkar', 'o+', 'O+', '01841409362', '01841409362', 'H-9, r-17/A, sector-12, Uttara, dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(209, 208, 'Aksirul Hasan Ronij', 'O+', 'O+', '01732538688', '01732538688', 'Uttara sec-12,Dhaka', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(210, 209, 'Mehjabin Tanha', 'A+', 'A+', '01580279523', '01580279523', 'Uttara 18 no sector,Ruap.', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55'),
(211, 210, 'Asaduzzaman Hasu', 'B+', 'B+', '01646141069', '01646141069', 'Tangail Sadar.', 'Shahidul Islam Blood Donor List', 'https://shahidulislam.com/blood-donor-list/', '2026-07-27 03:33:55');

-- --------------------------------------------------------

--
-- Table structure for table `report_share_links`
--

CREATE TABLE `report_share_links` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `report_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `access_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_accessed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_logs`
--

CREATE TABLE `session_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `email_or_phone` varchar(255) NOT NULL,
  `event_type` enum('LOGIN','LOGOUT') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session_logs`
--

INSERT INTO `session_logs` (`id`, `user_id`, `email_or_phone`, `event_type`, `created_at`) VALUES
(4, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 02:13:47'),
(5, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 02:14:02'),
(6, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 02:56:30'),
(7, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:34:51'),
(8, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:35:50'),
(9, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:37:40'),
(10, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:42:54'),
(11, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:44:45'),
(12, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:45:34'),
(13, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 03:45:57'),
(14, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 04:10:32'),
(15, 2, 'tanvir8153@gmail.com', 'LOGIN', '2026-07-27 04:21:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `height_unit` varchar(10) NOT NULL,
  `height_value` varchar(30) NOT NULL,
  `weight` varchar(30) NOT NULL,
  `address` text NOT NULL,
  `blood_group` varchar(10) NOT NULL,
  `chronic_disease` varchar(255) NOT NULL,
  `other_disease` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `token_version` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `email_verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `height_unit`, `height_value`, `weight`, `address`, `blood_group`, `chronic_disease`, `other_disease`, `password`, `password_hash`, `token_version`, `email_verified_at`, `created_at`, `updated_at`) VALUES
(2, 'Tanvir', 'Miraz', 'tanvir8153@gmail.com', '01762099987', 'cm', '175', '70', 'tanvir8153@gmail.com', 'B+', 'None / Healthy', '', '', '$argon2id$v=19$m=65536,t=3,p=4$Lf06ujU2yiXzzGW6szyI5A$FRnGzCD7IKYD1KMBdw58lvAlRjymzXWvz4BuULND1XA', 0, '2026-07-27 08:08:26', '2026-07-27 02:07:48', '2026-07-27 02:08:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_verification_user` (`user_id`),
  ADD KEY `idx_email_verification_expires` (`expires_at`),
  ADD KEY `idx_email_verification_used` (`used_at`);

--
-- Indexes for table `medical_reports`
--
ALTER TABLE `medical_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medical_reports_share_token` (`share_token`),
  ADD KEY `idx_medical_reports_user_id` (`user_id`),
  ADD KEY `idx_medical_reports_created_at` (`created_at`),
  ADD KEY `idx_medical_reports_storage_key` (`storage_key`(191));

--
-- Indexes for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_password_reset_code_user` (`user_id`),
  ADD KEY `idx_password_reset_code_expires` (`expires_at`),
  ADD KEY `idx_password_reset_code_used` (`used_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
  ADD KEY `idx_password_reset_user_id` (`user_id`),
  ADD KEY `idx_password_reset_expires_at` (`expires_at`),
  ADD KEY `idx_password_reset_used_at` (`used_at`);

--
-- Indexes for table `public_blood_donors`
--
ALTER TABLE `public_blood_donors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_source_row` (`source_row`),
  ADD KEY `idx_blood_location` (`blood_group_normalized`,`location_text`(120)),
  ADD KEY `idx_phone` (`phone_normalized`);

--
-- Indexes for table `report_share_links`
--
ALTER TABLE `report_share_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_share_token_hash` (`token_hash`),
  ADD KEY `idx_report_share_report_id` (`report_id`),
  ADD KEY `idx_report_share_user_id` (`user_id`),
  ADD KEY `idx_report_share_expires_at` (`expires_at`),
  ADD KEY `idx_report_share_revoked_at` (`revoked_at`);

--
-- Indexes for table `session_logs`
--
ALTER TABLE `session_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_logs_user_id` (`user_id`),
  ADD KEY `idx_session_logs_event_type` (`event_type`),
  ADD KEY `idx_session_logs_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD UNIQUE KEY `uq_users_phone` (`phone`),
  ADD KEY `idx_users_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `medical_reports`
--
ALTER TABLE `medical_reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `public_blood_donors`
--
ALTER TABLE `public_blood_donors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=212;

--
-- AUTO_INCREMENT for table `report_share_links`
--
ALTER TABLE `report_share_links`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `session_logs`
--
ALTER TABLE `session_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  ADD CONSTRAINT `fk_email_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `medical_reports`
--
ALTER TABLE `medical_reports`
  ADD CONSTRAINT `fk_medical_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD CONSTRAINT `fk_password_reset_code_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `report_share_links`
--
ALTER TABLE `report_share_links`
  ADD CONSTRAINT `fk_report_share_report` FOREIGN KEY (`report_id`) REFERENCES `medical_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_share_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `session_logs`
--
ALTER TABLE `session_logs`
  ADD CONSTRAINT `fk_session_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
