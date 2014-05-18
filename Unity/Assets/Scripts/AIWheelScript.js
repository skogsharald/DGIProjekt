#pragma strict

var maxSteer : float = 3.0f;
var myWheelCollider : WheelCollider;

function Start () {

}

function Update () {
	transform.Rotate(myWheelCollider.rpm/60*360*Time.deltaTime,0,0);
	transform.localEulerAngles.y = (myWheelCollider.steerAngle - transform.localEulerAngles.z - 180) * maxSteer;
	
	var hit : RaycastHit;
	var wheelPos : Vector3;
	if(Physics.Raycast(myWheelCollider.transform.position, -myWheelCollider.transform.up, hit, myWheelCollider.radius + myWheelCollider.suspensionDistance)){
		wheelPos = hit.point + myWheelCollider.transform.up * myWheelCollider.radius;
	} else {
		wheelPos = myWheelCollider.transform.position - myWheelCollider.transform.up * myWheelCollider.suspensionDistance;
	}
	
	transform.position = wheelPos;
}