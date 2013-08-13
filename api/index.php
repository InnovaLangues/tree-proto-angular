<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();

$user = "protojpp";
$pass = "protojpp";
$db = new PDO('mysql:host=localhost;dbname=protojpp', $user, $pass);

// TODO
$app->post('/path(/:id)', function ($id = null) use($app, $db) {

    $user="Donovan";
    $date = "";

    $request = $app->request();

    $body = $request->getBody();

    $body = json_decode($body);

    unset($body->history);

    $sql = "INSERT INTO paths (path, user, edit_date) VALUES (:path, :user, :edit_date)";

    if ($id) {
        //TODO update
        $sql = "UPDATE paths
                SET
                    path = :path,
                    user = :user,
                    edit_date = :edit_date
                WHERE id = :id";
    }


    try {

        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);

        if ($id) {
            $stmt->bindParam("id", $id);
        }

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

$app->get('/pathtemplate', function () use($app, $db) {
    $sql = "SELECT * FROM pathtemplates";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll();

    //TODO
    foreach ($results as $result) {
        $result = "toto";
    }

    echo json_encode($results);
});


$app->post('/pathtemplate', function () use($app, $db) {

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

$app->post('/pathtemplate/remove', function () use($app, $db) {

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
