<?php
require '../vendor/autoload.php';

ini_set('display_errors', 'on');

$app = new \Slim\Slim();

$user = "root";
$pass = "root";

$db = new PDO(
    'mysql:host=localhost;dbname=protojpp',
    $user,
    $pass
);

// List Paths
$app->get('/paths.json', function () use($app, $db)
{
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

// Add new Path
$app->post('/paths.json', function () use($app, $db)
{
    $user="Donovan"; //TODO
    $date = date('Y-m-d H:i:s'); //TODO

    $request = $app->request();

    $body = $request->getBody();
    $body = json_decode($body);

    $sql = "INSERT INTO paths (path, user, edit_date) VALUES (:path, :user, :edit_date)";

    try {

        $stmt = $db->prepare($sql);
        $stmt->bindParam("path", json_encode($body));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->execute();
        $lastId = $db->lastInsertId();

        $db = null;

        echo $lastId;

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Edit existing Path
$app->put('/paths/:id.json', function ($id) use($app, $db)
{
    $user="Donovan"; //TODO
    $date = date('Y-m-d H:i:s'); //TODO

    $request = $app->request();

    $body = $request->getBody();
    $body = json_decode($body);

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

        echo $id;

        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Delete single Path
$app->delete('/paths/:id.json', function ($id) use($app, $db)
{
    $sql = "DELETE FROM paths WHERE paths.id = :id"; //Save json into new table (pathtemplate)

    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();

        $db = null;

        echo 'ok';

    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Show single Path
$app->get('/paths/:id.json', function ($id) use($app, $db)
{
    $sql = "SELECT * FROM paths WHERE paths.id = :id";
    $stmt = $db->prepare($sql);
    $stmt->bindParam("id", $id);
    $stmt->execute();

    $result = $stmt->fetchObject();

    echo $result->path;

    $db = null;
});

// List Path Templates
$app->get('/path/templates.json', function () use($app, $db)
{
    $sql = "SELECT * FROM pathtemplates";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_CLASS);

    $templates = array();

    foreach ($results as $result) {
        $template = new stdClass();
        $template->id = $result->id;
        $template->name = $result->name;
        $template->description = $result->description;
        $template->step = json_decode($result->step);

        $templates[] = $template;
    }

    echo json_encode($templates);
});

// Add new Path Template
$app->post('/path/templates.json', function () use($app, $db)
{
    $user="Donovan"; //TODO
    $date = date('Y-m-d H:i:s'); //TODO

    $request = $app->request();

    $body = $request->getBody();
    $body = json_decode($body);

    $name        = $body->name;
    $description = $body->description;
    $step        = $body->step;

    $sql = "INSERT INTO pathtemplates (name, description, step, user, edit_date) VALUES (:name, :description, :step, :user, :edit_date)"; //Save json into new table (pathtemplate)

    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $name);
        $stmt->bindParam("description", $description);
        $stmt->bindParam("step", json_encode($step));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->execute();

        $lastId = $db->lastInsertId();

        $db = null;
        
        echo $lastId;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Edit existing Template
$app->put('/path/templates/:id.json', function ($id) use($app, $db)
{
    $user="Donovan"; //TODO
    $date = date('Y-m-d H:i:s'); //TODO

    $request = $app->request();

    $body = $request->getBody();
    $body = json_decode($body);

    $name        = $body->name;
    $description = $body->description;
    $step        = $body->step;
    
    $sql = "UPDATE pathtemplates
            SET
                name = :name,
                description = :description,
                step = :step,
                user = :user,
                edit_date = :edit_date
            WHERE id = :id";

    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $name);
        $stmt->bindParam("description", $description);
        $stmt->bindParam("step", json_encode($step));
        $stmt->bindParam("user", $user);
        $stmt->bindParam("edit_date", $date);
        $stmt->bindParam("id", $id);
        $stmt->execute();

        echo $id;

        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Delete single Path Template
$app->delete('/path/templates/:id.json', function ($id) use($app, $db)
{
    $sql = "DELETE FROM pathtemplates WHERE pathtemplates.id = :id"; //Save json into new table (pathtemplate)

    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();

        echo $id;
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});

// Run app
$app->run();