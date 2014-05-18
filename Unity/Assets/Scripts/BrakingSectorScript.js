#pragma strict
var maxBreakTorque : float;
var minCarSpeed : float;

function OnTriggerStay (other : Collider){
	if(other.tag == "AI"){
		
		var controlCurrentSpeed : float = other.transform.root.GetComponent(AICarScript).currentSpeed;
		if(controlCurrentSpeed >= minCarSpeed){
			other.transform.root.GetComponent(AICarScript).inSector = true;
			other.transform.root.GetComponent(AICarScript).wheelRR.brakeTorque = maxBreakTorque;
			other.transform.root.GetComponent(AICarScript).wheelRL.brakeTorque = maxBreakTorque;

		} else {
			other.transform.root.GetComponent(AICarScript).inSector = false;
			other.transform.root.GetComponent(AICarScript).wheelRR.brakeTorque = 0;
			other.transform.root.GetComponent(AICarScript).wheelRL.brakeTorque =0;
		}
	}
}

function OnTriggerExit(other : Collider){
	if(other.tag == "AI"){
		other.transform.root.GetComponent(AICarScript).wheelRR.brakeTorque = 0;
		other.transform.root.GetComponent(AICarScript).wheelRL.brakeTorque =0;
		other.transform.root.GetComponent(AICarScript).inSector = false;
	}
}