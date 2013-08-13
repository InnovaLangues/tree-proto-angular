<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();

$user = "protojpp";
$pass = "protojpp";
$db = new PDO('mysql:host=localhost;dbname=protojpp', $user, $pass);

$app->post('/pathversions', function () use($app, $db) {

    $history = null;

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    if (isset($body->path->history)) {
        $history = $body->path->history;
    }

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

    unset($body->history);

    try {
        $user = "Donovan";
        $date = "";
        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
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
            $path = json_decode($result->path);

            $history = $result->id;

            $path->history = $history;

            echo json_encode($path);
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

$app->get('/pathversions/init', function () use($app, $db) {

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

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    unset($body->history);

    $sql = "INSERT INTO pathtemplates (path, user, edit_date) VALUES (:path, :user, :edit_date)"; //Save json into new table (pathtemplates)

    try {

        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->execute();
        $lastId = $db->lastInsertId();

        $sql = "SELECT id, path FROM pathtemplates WHERE pathtemplates.id = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $lastId);
        $stmt->execute();

        $result = $stmt->fetchObject();

        if ($result) {
            echo $lastId;
        }

        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->post('/pathtemplates/remove', function () use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $sql = "DELETE FROM pathtemplates WHERE pathtemplates.id = :id"; //Save json into new table (pathtemplates)

    try {

        $stmt = $db->prepare($sql);

        $stmt->bindParam("id", $body);
        $stmt->execute();


        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});


$app->run();
