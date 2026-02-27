<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");


include_once("db_connect.php");

$postdata = file_get_contents("php://input");

if(isset($postdata) && !empty($postdata)) {
    $request = json_decode($postdata);

    if(!isset($request->nombre) || !isset($request->email)) {
         echo json_encode(['status' => false, 'message' => 'Faltan datos']);
         exit;
    }

    $nombre = trim($request->nombre);
    $email = trim($request->email);
    $password = trim($request->password);
    $rol = trim($request->rol);

    $sql_check = "SELECT email FROM usuarios WHERE email = :email";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bindParam(':email', $email);
    $stmt_check->execute();

    if ($stmt_check->rowCount() > 0) {
        echo json_encode(['status' => false, 'message' => 'El correo ya está registrado']);
    } else {
        $password_hashed = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (:nombre, :email, :password, :rol)";
        $stmt = $conn->prepare($sql);
        
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password_hashed); 
        $stmt->bindParam(':rol', $rol);

        if($stmt->execute()) {
            echo json_encode(['status' => true, 'message' => 'Usuario creado exitosamente']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Error al crear usuario']);
        }
    }
}
?>