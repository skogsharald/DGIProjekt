
var centerOfMass : Vector3;
var path : Array;
var pathGroup : Transform;
var maxSteer : float = 15.0f;
var wheelFR : WheelCollider;
var wheelFL : WheelCollider;
var wheelRR : WheelCollider;
var wheelRL : WheelCollider; 
var currentPathObject : int;
var distFromPath : float = 20;
var maxTorque : float = 50;
var currentSpeed : float;
var topSpeed : float = 150;
var decellerationSpeed : float = 10;
var inSector : boolean;
var sensorLength : float = 5;
var frontSensorStartPoint : float = 3.42;
var frontSensorSideDistance : float = 1.2;
var frontSensorAngle : float = 30;
var sidewaySensorLength : float = 5;
var rightXBounds : float = 992.5453;
var leftXBounds : float = 1007.341;
var avoidSpeed : float = 10;
var currentCarPassing : Transform;
var beingOverTaken : boolean = false;
private var flag : int = 0;
private var startPos : Vector3;




function Start () {
	startPos = transform.position;
	rigidbody.centerOfMass = centerOfMass;
	GetPath();
}

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

function Update () {
	if(flag == 0)
		GetSteer();
	Move();
	Sensors();
}

// Function for steering
function GetSteer(){
	var steerVector : Vector3 = transform.InverseTransformPoint(Vector3(path[currentPathObject].position.x, transform.position.y, path[currentPathObject].position.z));
	var newSteer : float = maxSteer*(steerVector.x / steerVector.magnitude);
	wheelFL.steerAngle = newSteer;
	wheelFR.steerAngle = newSteer;
	
	// Determine when and where to go
	Debug.Log(Mathf.Abs(transform.position.z-path[currentPathObject].transform.position.z));
	if(Mathf.Abs(transform.position.z-path[currentPathObject].transform.position.z) <= distFromPath){
		currentPathObject++;
		if(currentPathObject == path.length-1){
			transform.position = startPos;
			currentPathObject = 0;
		}
	}
}

// Function for actually moving the car
function Move(){
	currentSpeed = 2*(22/7)*wheelRL.radius *wheelRL.rpm * 60/1000;
	currentSpeed = Mathf.Round(currentSpeed);
	if(currentSpeed <= topSpeed && !inSector){
		wheelRR.brakeTorque = 0;
		wheelRL.brakeTorque = 0;
		wheelRL.motorTorque = maxTorque;
		wheelRR.motorTorque = maxTorque;
	} else if (!inSector){
		wheelRL.motorTorque = 0;
		wheelRR.motorTorque = 0;
		wheelRL.brakeTorque = decellerationSpeed;
		wheelRR.brakeTorque = decellerationSpeed;
	}
	
}

function Sensors(){
	flag = 0;
	var avoidSensitivity : float = 0;
	var pos : Vector3;
	var hit : RaycastHit;
	var rightAngle = Quaternion.AngleAxis(frontSensorAngle, transform.up) * transform.forward;
	var leftAngle = Quaternion.AngleAxis(-frontSensorAngle, transform.up) * transform.forward;
	var rearRightAngle = Quaternion.AngleAxis(-frontSensorAngle, transform.up) * -transform.forward;
	var rearLeftAngle = Quaternion.AngleAxis(frontSensorAngle, transform.up) * -transform.forward;
	
	pos = transform.position;
	pos += transform.forward*frontSensorStartPoint;
	
	// Braking sensor
	if(Physics.Raycast(pos, transform.forward, hit, sensorLength)){
		if(hit.transform.tag != "Terrain"){
			flag++;
			Debug.DrawLine(pos, hit.point, Color.red);
			wheelRL.brakeTorque = decellerationSpeed;
			wheelRR.brakeTorque = decellerationSpeed;
		}
	} else {
		wheelRL.brakeTorque = 0;
		wheelRR.brakeTorque = 0;
	}

		
	if(currentCarPassing != null){
		// Front straight right sensor
		pos += transform.right*frontSensorSideDistance;
		if( pathGroup.name != "OuterLeftLane"){
			if(Physics.Raycast(pos, transform.forward, hit, sensorLength)){
				if(hit.transform.tag != "Terrain"){
					flag++;
					avoidSensitivity -= 0.25;
					Debug.Log("Turning left");
					Debug.DrawLine(pos, hit.point, Color.white);
				}
				
			} else if(Physics.Raycast(pos, rightAngle, hit, sensorLength)){
				flag++;
				avoidSensitivity -= 0.125;
				Debug.DrawLine(pos, hit.point, Color.white);
			}
		}
		
		

		// Front straight left sensor
		pos = transform.position;
		pos += transform.forward*frontSensorStartPoint;
		pos -= transform.right*frontSensorSideDistance;
		if(pathGroup.name != "OuterRightLane"){
			if(Physics.Raycast(pos, transform.forward, hit, sensorLength))
			{
				if(hit.transform.tag != "Terrain"){
					flag++;
					avoidSensitivity += 0.25;
					Debug.Log("Turning right");
					Debug.DrawLine(pos, hit.point, Color.white);
				} // Front angled sensor
			} else if(Physics.Raycast(pos, leftAngle, hit, sensorLength))
			{
				flag++;
				avoidSensitivity += 0.125;
				Debug.DrawLine(pos, hit.point, Color.white);
			}
		}

		// Rear sensors
		pos = transform.position;
		pos += -transform.forward*frontSensorStartPoint;
		pos += transform.right*frontSensorSideDistance;
		if(Physics.Raycast(pos, transform.right, hit, sensorLength)){
			if(hit.transform.tag != "Terrain"){
				flag++;
				avoidSensitivity += 0;
				Debug.Log("Going straight");
				Debug.DrawLine(pos, hit.point, Color.red);
			} // Front angled sensor
		} else if(Physics.Raycast(pos, rearRightAngle, hit, sensorLength)){
			flag++;
			avoidSensitivity += 0;
			Debug.DrawLine(pos, hit.point, Color.red);
		}
	}
	// Right sideway sensor
	/*
	if(Physics.Raycast(transform.position, transform.right, hit, sidewaySensorLength)){
		if(hit.transform.tag != "Terrain"){
			flag++;
			avoidSensitivity -= 0.5;
			Debug.DrawLine(transform.position, hit.point, Color.white);
		}
	}
	
	
	// Left sideway sensor
	if(Physics.Raycast(transform.position, -transform.right, hit, sidewaySensorLength)){
		if(hit.transform.tag != "Terrain"){
			flag++;
			avoidSensitivity += 0.5;
			Debug.DrawLine(transform.position, hit.point, Color.white);
		}
	}
	*/
	
	
	// Front mid sensor
	if (avoidSensitivity == 0 && !beingOverTaken){
		if(Physics.Raycast(pos, transform.forward, hit, sensorLength)){
			if(hit.transform.tag != "Terrain"){
				currentCarPassing = hit.transform;
				currentCarPassing.root.GetComponent(AICarScript).beingOverTaken = true;
				if(pathGroup.transform.name == "OuterRightLane"){
					avoidSensitivity = -0.25;
				} else if (pathGroup.transform.name == "OuterLeftLane"){
					avoidSensitivity = 0.25;
				} else {
					if(hit.normal.x <0)
						avoidSensitivity = -0.25;
					else
						avoidSensitivity = 0.25;
				}
				Debug.DrawLine(pos, hit.point, Color.white);
			}
		} else {
			currentCarPassing == null;
		}
	}
	
//	if(currentCarPassing != null){
//		Debug.Log(currentCarPassing.position.z + ", " + transform.position.z);
//		if(currentCarPassing.position.z < transform.position.z){
//			flag = 0;
//		}
//	}
	if(flag != 0){
		AvoidSteer(avoidSensitivity);
	}
	
}

function AvoidSteer(sensitivity : float){
	wheelFL.steerAngle = avoidSpeed*sensitivity;
	wheelFR.steerAngle = avoidSpeed*sensitivity;
}






