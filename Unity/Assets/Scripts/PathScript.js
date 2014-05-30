/* 
	Script written to guide car along a given path.
	Written by ? at FlatTutorials
	(www.flattutorials.com)
*/

var path : Array;
var rayColor: Color =  Color.white;

function OnDrawGizmos(){
	Gizmos.color = rayColor;
	// Get all objects that are children of the path object
	var path_objects : Array = transform.GetComponentsInChildren(Transform);
	path = new Array();
	
	for(var path_obj : Transform in path_objects){
	// Make sure the parent of this object is not added to the array
		if(path_obj != transform){
			path[path.length] = path_obj;
		}
	}
	
	for(var i :int = 0; i < path.length; i++){
		// Set this position to be the one of the current object
		var pos : Vector3 = path[i].position;
		// Save the previous position and draw a line between the previous path object and the current one
		if(i>0){
			var prev = path[i-1].position;
			Gizmos.DrawLine(prev, pos);
			Gizmos.DrawWireSphere(pos, 0.3f);
		}
	} 
}
 