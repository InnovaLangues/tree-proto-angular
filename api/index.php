<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();

$user = "protojpp";
$pass = "protojpp";
$db = new PDO('mysql:host=localhost;dbname=protojpp', $user, $pass);

$app->post('/pathversions', function () use($app, $db) {

    $request = $app->request();

    $body = $request->getBody();

    $path = json_decode($body);

    $history = $path->history;

    // Delete all future versions
    if ($history) {
        $sql = "DELETE FROM pathversions WHERE pathversions.id > (:history)";

        try {
            $stmt = $db->prepare($sql);
            $stmt->bindParam("history", $history);
            $stmt->execute();
        } catch(PDOException $e) {
            echo '{"error":{"text":'. $e->getMessage() .'}}';
        }
    }

    $sql = "INSERT INTO pathversions (path, user, edit_date) VALUES (:path, :user, :edit_date)";

    unset($path->history);

    try {
        $user = "Donovan";
        $date = "";
        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($path));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->execute();

        $lastId = $db->lastInsertId();

        $sql = "SELECT id, path FROM pathversions WHERE pathversions.id = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $lastId);
        $stmt->execute();

        $result = $stmt->fetchObject();


        if ($result) {
            $json = json_decode($result->path);

            $history = $result->id;

            $json->history = $history;

            echo json_encode($json);
        }

        $db = null;

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->get('/pathversions/undo/:id', function ($id) use($app, $db) {

    // TODO WHERE USER = USER COURANT, etc...

    $sql = "SELECT id, path FROM pathversions WHERE pathversions.id < $id ORDER BY id DESC LIMIT 1";

    try {
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $db = null;

        $result = $stmt->fetchObject();

        if ($result) {
            $path = json_decode($result->path);
            $path->history = $result->id;
            echo json_encode($path);
        } else {
            echo "end";
        }

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->get('/pathversions/redo/:id', function ($id) use($app, $db) {

    // TODO WHERE USER = USER COURANT, etc...

    $sql = "SELECT id, path FROM pathversions WHERE pathversions.id > $id LIMIT 1";

    try {
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $db = null;

        $result = $stmt->fetchObject();

        if ($result) {
            $path = json_decode($result->path);
            $path->history = $result->id;
            echo json_encode($path);
        } else {
            echo "end";
        }

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->get('/pathtemplates/init', function () use($app, $db) {

    // TODO REMOVE ME

    $sql = "TRUNCATE TABLE pathversions";

    try {
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// TODO
$app->post('/pathtemplates', function () use($app, $db) {
    $sql = ""; //Save json into new table (pathtemplates)
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->run();
