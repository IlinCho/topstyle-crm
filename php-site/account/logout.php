<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/customer_auth.php';

clear_customer_session();
redirect_to('/index.php');
