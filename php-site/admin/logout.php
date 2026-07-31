<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/auth.php';

clear_admin_session();
redirect_to('/admin/login.php');
