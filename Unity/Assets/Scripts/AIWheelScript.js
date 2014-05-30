#pragma strict

/*
	Script written to turn and spin the wheels of the car.
	Written by ? at FlatTutorials. 
	(www.flattutorials.com)
*/

var maxSteer : float = 3.0f;
var myWheelCollider : WheelCollider;

function Start () {

}

function Update () {
	// Spin the wheels
	transform.Rotate(myWheelCollider.rpm/60*360*Time.deltaTime,0,0);
	// Turn the front wheels to give a sense of interaction from "driver"
	transform.localEulerAngles.y = (myWheelCollider.steerAngle - transform.localEulerAngles.z - 180) * maxSteer;
	
	// Add suspension to the car
	var hit : RaycastHit;
	var wheelPos : Vector3;
	if(Physics.Raycast(myWheelCollider.transform.position, -myWheelCollider.transform.up, hit, myWheelCollider.radius + myWheelCollider.suspensionDistance)){
		wheelPos = hit.point + myWheelCollider.transform.up * myWheelCollider.radius;
	} else {
		wheelPos = myWheelCollider.transform.position - myWheelCollider.transform.up * myWheelCollider.suspensionDistance;
	}
	transform.position = wheelPos;
}