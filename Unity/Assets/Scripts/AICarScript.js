
/* 
	Script based on the AICarScript written by FlatTutorials
	(www.flattutorials.com)
	Extended to fit the needs for this project by Ludvig Jansson, 911223-2872
*/

var centerOfMass : Vector3; // Adjust the center of mass of the car to counter its tendency to tip
var path : Array; // The path the car is following
var pathGroup : Transform; // The original GameObject of the path
var maxSteer : float = 15.0f; // Constant to add sense of "steering"
var wheelFR : WheelCollider; // | Wheels
var wheelFL : WheelCollider; // | of
var wheelRR : WheelCollider; // | the
var wheelRL : WheelCollider; // v car
var currentPathObject : int; // The current index of the path the car is in
var distFromPath : float = 20; // The proximity threshold when the car changes currentPathObject
var maxTorque : float = 50; // Motor torque to move the car
var currentSpeed : float; // The current speed
var topSpeed : float = 150; // The maximum speed of the car
var decellerationSpeed : float = 60; // This is applied when the car is braking
var brakeSensorLength : float = 12; // How far ahead the brake sensor picks up objects
var sensorLength : float = 10; // How far the regular sensors are
var angleSensorLength : float = 8; // How far the angled sensors are
var frontSensorStartPoint : float = 3.42; // Where the front sensors are located on the car, is multiplied with the car's forward vector
var frontSensorSideDistance : float = 1.2; // Where the front side sensors are located relative to the front, multiplied with the car's right vector
var frontSensorAngle : float = 30; // The angle the angled sensors have
var sidewaySensorLength : float = 3; // The length of the sensors on the side of the car
var rightXBounds : float = 992.5453; // The road's right x bounds
var leftXBounds : float = 1007.341; // The road's left x bounds
var avoidSpeed : float = 10; // Force applied to the car in order to avoid other cars
var currentCarPassing : Transform; // The current car this car is passing (if applicable)
var beingOverTaken : boolean = false; // If this car is being overtaken by another
var overTaking : boolean = false; // If this car is overtaking another car
private var flag : int = 0; // This is used to let the script know if the car is avoiding another car
private var startPos : Vector3; // Used to reset the car when it has reached the end of the road



/*
	This function is called when the program starts
*/
function Start () {
 	/*
 		Save the start position, set the center of mass and retrieve the path objects 
 	*/
	startPos = transform.position;
	rigidbody.centerOfMass = centerOfMass;
	GetPath();
}

/*
	Retrieve the path objects from the path GameObject
*/
function GetPath(){
	var path_objects : Array = pathGroup.GetComponentsInChildren(Transform);
	path = new Array();
	
	for(var path_obj : Transform in path_objects){
	// Make sure the parent of this object is not added to the array
		if(path_obj != pathGroup){
			path[path.length] = path_obj;
		}
	}
}

/*
	This function is called repeatedly until the program is terminated
*/
function Update () {
	// Figure out which path object to steer to
	GetSteer();
	// Move to this path object
	Move();
	// See if the car needs to avoid any other cars and does this of so
	Sensors();
}

/* 
	Function for steering
*/
function GetSteer(){
	// Get the direction this car is currently going in
	var steerVector : Vector3 = transform.InverseTransformPoint(Vector3(path[currentPathObject].position.x, transform.position.y, path[currentPathObject].position.z));
	// Find the new steer angle of the front wheels and set it
	var newSteer : float = maxSteer*(steerVector.x / steerVector.magnitude);
	wheelFL.steerAngle = newSteer;
	wheelFR.steerAngle = newSteer;
	
	// Determine if the car should steer towards the next path object
	if(Mathf.Abs(transform.position.z-path[currentPathObject].transform.position.z) <= distFromPath){
		currentPathObject++;
		if(currentPathObject == path.length-1){
			transform.position = startPos;
			currentPathObject = 0;
		}
	}
}

/* 
	Function for actually moving the car
*/
function Move(){
	// Calculate the speed the car is currently travelling in
	currentSpeed = 2*(22/7)*wheelRL.radius *wheelRL.rpm * 60/1000;
	currentSpeed = Mathf.Round(currentSpeed);
	// Accellerate if the car hasn't reached max speed and brake if it has
	if(currentSpeed <= topSpeed){
		wheelRR.brakeTorque = 0;
		wheelRL.brakeTorque = 0;
		wheelRL.motorTorque = maxTorque;
		wheelRR.motorTorque = maxTorque;
	} else {
		wheelRL.motorTorque = 0;
		wheelRR.motorTorque = 0;
		wheelRL.brakeTorque = decellerationSpeed;
		wheelRR.brakeTorque = decellerationSpeed;
	}
	
}

/*
	This handles the real car AI. The foundation of this code was provided by the Car AI tutorial, 
	but most of the code was written by Ludvig Jansson.
*/
function Sensors(){
	flag = 0; // Reset the flag
	var avoidSensitivity : float = 0; // Reset the avoid sensitivity, which will be used to steer the car
	var pos : Vector3; // This will contain the original position of rays cast from the car
	var hit : RaycastHit; // These three contain information of what the ray hit if it did
	var rightSideHit : RaycastHit;
	var leftSideHit : RaycastHit;
	// Calculate angles for the angled rays
	var rightAngle = Quaternion.AngleAxis(frontSensorAngle, transform.up) * transform.forward;
	var leftAngle = Quaternion.AngleAxis(-frontSensorAngle, transform.up) * transform.forward;
	var rearRightAngle = Quaternion.AngleAxis(-frontSensorAngle, transform.up) * -transform.forward;
	var rearLeftAngle = Quaternion.AngleAxis(frontSensorAngle, transform.up) * -transform.forward;
	// Figure out the left and right bounds of the vehicle in global coordinates
	var carRightBounds : Vector3 = transform.position + transform.right*frontSensorSideDistance;
	var carLeftBounds : Vector3 = transform.position - transform.right*frontSensorSideDistance;
	
	pos = transform.position;
	pos += transform.forward*frontSensorStartPoint;
	var halfRightPos : Vector3 = pos + transform.right*frontSensorSideDistance*2/3;
	var halfLeftPos : Vector3 = pos - transform.right*frontSensorSideDistance*2/3;
	
	// Fire away the braking sensors
	if(Physics.Raycast(pos, transform.forward, hit, brakeSensorLength)){
		// Middle sensor
		Brake(hit, pos);	
	}  else if(Physics.Raycast(halfRightPos, transform.forward, hit, brakeSensorLength)){
	    // Right sensor
		Brake(hit, pos);
	} else if(Physics.Raycast(halfLeftPos, transform.forward, hit, brakeSensorLength)){
		// Left sensor
		Brake(hit, pos);
	} else {
		// Reset the braking if no obstacle is hit
		wheelRL.brakeTorque = 0;
		wheelRR.brakeTorque = 0;
	}

	// If the car is currently overtaking, it needs to avoid the other car(s)
	if(overTaking){
		pos += transform.right*frontSensorSideDistance;
		// Front straight right sensor
		if( pathGroup.name != "OuterLeftLane"){ 
		// This sensor makes the car turn left, which it shouldn't if it's in the leftmost lane
			if(Physics.Raycast(pos, transform.forward, hit, sensorLength)){
				if(carLeftBounds.x < leftXBounds){
					// Make sure the script picks up that the car is avoiding another car
					flag++;
					// Turn
					avoidSensitivity -= 0.1;
					Debug.Log("Turning left");
					Debug.DrawLine(pos, hit.point, Color.white);
				}
				// Front angled right sensor
			} else if(Physics.Raycast(pos, rightAngle, hit, angleSensorLength)){
				if(carLeftBounds.x > leftXBounds){
					flag++;
					avoidSensitivity -= 0.02;
					Debug.DrawLine(pos, hit.point, Color.white);
				}
			}
		} 
		

		// Front straight left sensor
		pos = transform.position;
		pos += transform.forward*frontSensorStartPoint;
		pos -= transform.right*frontSensorSideDistance;
		if(pathGroup.name != "OuterRightLane"){
			if(Physics.Raycast(pos, transform.forward, hit, sensorLength))
			{
				if(carRightBounds.x > rightXBounds)
					avoidSensitivity += 0.1;
					Debug.Log("Turning right");
					Debug.DrawLine(pos, hit.point, Color.white);
				} // Front left angled sensor
			} else if(Physics.Raycast(pos, leftAngle, hit, angleSensorLength))
			{
				if(carRightBounds.x > rightXBounds){
					flag++;
					avoidSensitivity += 0.02;
					Debug.DrawLine(pos, hit.point, Color.white);
				}
			}
		

		// Rear right sensors
		pos = transform.position;
		pos += -transform.forward*frontSensorStartPoint;
		pos += transform.right*frontSensorSideDistance;
		if(Physics.Raycast(pos, transform.right, hit, sensorLength)){
			if(carLeftBounds.x < leftXBounds){
				flag++;
				avoidSensitivity -= 0.1;
				Debug.Log("Going left");
				Debug.DrawLine(pos, hit.point, Color.red);
			} // Rear right angled sensor
		} else if(Physics.Raycast(pos, rearRightAngle, hit, sensorLength)){
			if(carLeftBounds.x < leftXBounds){
				flag++;
				avoidSensitivity -= 0.0125;
				Debug.DrawLine(pos, hit.point, Color.red);
			}
		}
		
		// Rear left sensors
		pos -= transform.right*frontSensorSideDistance;
		if(Physics.Raycast(pos, -transform.right, hit, sensorLength)){
			if(carRightBounds.x > rightXBounds){
				flag++;
				avoidSensitivity += 0.1;
				Debug.Log("Going right");
				Debug.DrawLine(pos, hit.point, Color.red);
			} // Rear left angled sensor
		} else if(Physics.Raycast(pos, rearRightAngle, hit, sensorLength)){
			if(carRightBounds.x > rightXBounds){
				flag++;
				avoidSensitivity += 0.0125;
				Debug.DrawLine(pos, hit.point, Color.red);
			}
		}
		
		 //Right sideway sensor
		if(Physics.Raycast(transform.position, transform.right, rightSideHit, sidewaySensorLength)){
			if(carLeftBounds.x < leftXBounds){
				flag++;
				avoidSensitivity -= 0.0125;
				Debug.DrawLine(transform.position, hit.point, Color.white);
			}
		}

		
		// Left sideway sensor
		if(Physics.Raycast(transform.position, -transform.right, leftSideHit, sidewaySensorLength)){
			if(carRightBounds.x > rightXBounds){
				flag++;
				avoidSensitivity += 0.0125;
				Debug.DrawLine(transform.position, hit.point, Color.white);
			}
		}
		
		// Go straight forward if the ray hits obstacles on both sides
		if(leftSideHit.transform != null && rightSideHit.transform != null){
			Debug.Log("Both side hit");
			avoidSensitivity = 0;	
		}
		// Check if the car is very close to a car to the left or right and avoid this
		if(leftSideHit.transform != null)
			if(Mathf.Abs(leftSideHit.transform.position.x - transform.position.x) < 4){
				avoidSensitivity -= 0.2;
				flag ++;
			}
		if(rightSideHit.transform != null){
			if(Mathf.Abs(rightSideHit.transform.position.x - transform.position.x) < 4){
				avoidSpeed += 0.2;
				flag ++;
			}
		}
	}

	
	
	// Front mid sensor, lets the car know where to go if obstacle is straight in front of it
	if (avoidSensitivity == 0 && !beingOverTaken){
		if(Physics.Raycast(pos, transform.forward, hit, sensorLength)){
			flag++;
			if(pathGroup.transform.name == "OuterRightLane"){
				avoidSensitivity = -0.1;
			} else if (pathGroup.transform.name == "OuterLeftLane"){
				avoidSensitivity = 0.1;
			} else {
				if(hit.normal.x <0)
					avoidSensitivity = -0.1;
				else
					avoidSensitivity = 0.1;
			}
			Debug.DrawLine(pos, hit.point, Color.white);
		}
	}
	
	// If the flag is not 0, then the car needs to avoid another car
	if(flag != 0){
		AvoidSteer(avoidSensitivity);
	}
	// See if this car is finished passing another vehicle, if it is
	if(currentCarPassing != null){
		var currentCarPassingFrontPosition : Vector3 = currentCarPassing.position + currentCarPassing.forward*frontSensorStartPoint;
		var thisBackPosition : Vector3 = transform.position - transform.forward*frontSensorStartPoint;
		if(currentCarPassingFrontPosition.z > thisBackPosition.z){
			currentCarPassing.root.GetComponent(AICarScript).beingOverTaken = false;
			overTaking = false;
		}
	}
	
}

/*
	Steer the car to avoid another vehicle/obstacle.
	The speed set at compile-time is multiplied with the accumulated sensitivity.
*/
function AvoidSteer(sensitivity : float){
	wheelFL.steerAngle = avoidSpeed*sensitivity;
	wheelFR.steerAngle = avoidSpeed*sensitivity;
}

/*
	If the car needs to brake as decided by the Sensors() function, this function handles
	it.
*/
function Brake(hit : RaycastHit, pos : Vector3){
	// Make sure it actually was a car the ray hit
	if(hit.transform.tag == "Car"){
		currentCarPassing = hit.transform;
		// Brake down to just less than the other car's speed
		if(currentSpeed >= currentCarPassing.root.GetComponent(AICarScript).currentSpeed - 5){
			flag++;
			Debug.DrawLine(pos, hit.point, Color.red);
			wheelRL.brakeTorque = decellerationSpeed;
			wheelRR.brakeTorque = decellerationSpeed;
			currentCarPassing.root.GetComponent(AICarScript).beingOverTaken = true;
			overTaking = true;
		}	 
	}
}






