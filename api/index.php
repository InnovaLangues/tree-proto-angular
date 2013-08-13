<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();

$user = "protojpp";
$pass = "protojpp";
$db = new PDO('mysql:host=localhost;dbname=protojpp', $user, $pass);

$app->get('/paths.json', function () use($app, $db) {
    $sql = "SELECT * FROM paths";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_CLASS);

    $paths = array();

    foreach ($results as $result) {
        $paths[$result->id] = json_decode($result->path);
    }

    echo json_encode($paths);
});

$app->post('/paths.json', function () use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    unset($body->history);

    $sql = "INSERT INTO paths (path, user, edit_date) VALUES (:path, :user, :edit_date)";

    try {

        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->execute();
        $lastId = $db->lastInsertId();

        $sql = "SELECT id, path FROM paths WHERE paths.id = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $lastId);
        $stmt->execute();

        $db = null;

        echo $lastId;

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->put('/paths/:id.json', function ($id) use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    unset($body->history);

    $sql = "UPDATE paths
            SET
                path = :path,
                user = :user,
                edit_date = :edit_date
            WHERE id = :id";

    try {

        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $lastId = $db->lastInsertId();

        $sql = "SELECT id, path FROM paths WHERE paths.id = :id";
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

$app->delete('/paths/:id.json', function ($id) use($app, $db) {
    $sql = "DELETE FROM paths WHERE paths.id = :id"; //Save json into new table (pathtemplate)

    try {

        $stmt = $db->prepare($sql);

        $stmt->bindParam("id", $id);
        $stmt->execute();

        $db = null;

        echo('ok');

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

$app->get('/pathtemplates.json', function () use($app, $db) {
    $sql = "SELECT * FROM pathtemplates";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_OBJ);

    //TODO

    $templates = array();

    foreach ($results as $value) {
        $templates[] = $value->path;
    }

    echo ($templates);
});


$app->post('/pathtemplates.json', function () use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    unset($body->history);

    $sql = "INSERT INTO pathtemplates (path, user, edit_date) VALUES (:path, :user, :edit_date)"; //Save json into new table (pathtemplate)

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

$app->post('/pathtemplates/remove.json', function () use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $sql = "DELETE FROM pathtemplates WHERE pathtemplates.id = :id"; //Save json into new table (pathtemplate)

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
