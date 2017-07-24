'use strict'; /*jslint node:true*/

function find_player(screen){
    for (let x = 0; x<screen_height; x++)
    {
        let row = screen[x];
        for (let y = 0; y<row.length; y++)
        {
            if (row[y]=='A')
                return {x, y};
        }
    }
};

function find_targets(target_types, screen){   
	var diamonds = [];
	for (let x = 0; x<screen_height; x++)
    {		
        let row = screen[x];        
        for (let y = 0; y<row.length; y++)
        {
          if (target_types.includes(screen[x][y])){
            diamonds.push({x, y});           
          }
          // else if (find_butts){
          //   if ('/-\\'.includes(screen[x][y])){
          //     if (is_closed_butt(screen, x, y, [])){
          //       diamonds.push({x, y});
          //     }
          //   }
          // }
        }		
    }  
	return diamonds;
};

function get_path_to_kill_butt(butts, screen, graph, self){
  var min_dist = 999999;
  var closest_butt = undefined;
  butts.forEach(function(butt) {
    var dist = get_manhatten_dist(self.x, self.y, butt.x, butt.y);
    if (dist < min_dist){
      min_dist = dist;
      closest_butt = butt; 
    }
  }, this);

  if (closest_butt == undefined) return undefined;

  var x = closest_butt.x - 1;
  var y = closest_butt.y;
  var butt_kill_path = undefined;
  var min_path_length = 999999;
  while (x > 0){
    if (screen[x][y]== ':'){
      var end = graph.grid[x][y];
      var path = astar.search(graph, self, end);  
      if (path.length > 0 && path.length < min_path_length){       
        butt_kill_path = path;      
        min_path_length = path.length;  
      }      
    }
    x--;      
  }

  return butt_kill_path;
}

function get_shortest_path(start, diamonds, graph, nearest_corner){
	var min_dist = 999999;
  var shortest_path = undefined; 
 

	for (let i = 0; i < diamonds.length; i++)
	{
    var diamond = diamonds[i];
    if (graph.grid[diamond.x][diamond.y].weight == 0) continue;

    var end = graph.grid[diamond.x][diamond.y];
    var path = astar.search(graph, start, end);  

		if (path.length > 0 && path.length < min_dist)
		{			
			min_dist = path.length;
			shortest_path = path;
		}
  }	
  
  //здесь начинаются пляски с траекторией
  if (shortest_path == undefined || nearest_corner == undefined){
    return shortest_path;
  }

  min_dist = 999999; 
  var target = shortest_path[shortest_path.length - 1];
  for (let i = 0; i < diamonds.length; i++)
	{
    var diamond = diamonds[i];
    if (graph.grid[diamond.x][diamond.y].weight == 0) continue;    

    if (nearest_corner == CORNER_TYPE.LT && (diamond.x >= target.x || diamond.y >= target.y )) continue;
    if (nearest_corner == CORNER_TYPE.LD && (diamond.x <= target.x || diamond.y >= target.y )) continue;
    if (nearest_corner == CORNER_TYPE.RT && (diamond.x >= target.x || diamond.y <= target.y )) continue;
    if (nearest_corner == CORNER_TYPE.RD && (diamond.x <= target.x || diamond.y <= target.y )) continue;

    var end = graph.grid[diamond.x][diamond.y];
    var path = astar.search(graph, start, end);  

		if (path.length > 0 && path.length < min_dist)
		{			
			min_dist = path.length;
			shortest_path = path;
		}
  }	

	return shortest_path;
};

function init_graph(screen)
{
  var arr = []; 
	for (let x = 0; x<screen_height; x++)
    {
		var arrRow = [];
    let row = screen[x];
    for (let y = 0; y<row.length; y++)
    {
      if ('A :*|/-\\'.includes(screen[x][y]))        
        arrRow.push(1);        
      else if ('+#'.includes(screen[x][y])){           
        arrRow.push(0);
      }
      else if ('O'.includes(screen[x][y])){             
        arrRow.push(0); //пока помечаем непроходимым
      }  
      else {     
        console.log("Unknown symbol");
        throw "Unknown symbol";
      }
      
    }
		arr.push(arrRow);
	}
	return new Graph(arr);
};


function afraid_of_butterfly(screen, graph, self, butts)
{ 
    for (let i = 0; i < butts.length; ++i){
      //set_butt_weights(screen, graph, butt_coords[i].x, butt_coords[i].y);
      set_butt_weights2(screen, graph, butts[i], self);
    }
}

function get_manhatten_dist(x1, y1, x2, y2){
  return Math.abs(x1 - x2) + Math.abs(y1-y2);
}

function get_nearest_corner(self_x, self_y, screen){
  if (self_x < screen_height / 2){
    return self_y < screen[self_x].length / 2 ? CORNER_TYPE.LT : CORNER_TYPE.RT;
  }
  else {
    return self_y < screen[self_x].length / 2 ? CORNER_TYPE.LD : CORNER_TYPE.RD;
  }
}

function set_butt_weights2(screen, graph, butt, self){

  var x = butt.x;
  var y = butt.y;

  if (!is_closed_butt(butt)){
    graph.grid[x][y].weight = 0; //сама бабочка непроходима, если она уже открыта
  } 

  if (get_manhatten_dist(get_manhatten_dist(self.x, self.y, x, y) == 1)){//если рядом с бабочком, все сос. точки проходимы
    return;
  }

  if (get_manhatten_dist(self.x - 1, self.y, x, y) <= 2 ){    
    graph.grid[self.x - 1][self.y].weight = 0;        
  }
  if (get_manhatten_dist(self.x + 1, self.y, x, y) <= 2 ){    
    graph.grid[self.x + 1][self.y].weight = 0;        
  }
  if (get_manhatten_dist(self.x, self.y - 1, x, y) <= 2 ){    
    graph.grid[self.x][self.y - 1].weight = 0;        
  }
  if (get_manhatten_dist(self.x, self.y + 1, x, y) <= 2 ){    
    graph.grid[self.x][self.y + 1].weight = 0;        
  }
}

function check_closed_butts(screen){ 
  for (var i = close_butts.length - 1; i >= 0; --i){
    if (!is_closed_butt_tmp(screen, close_butts[i].x, close_butts[i].y, [])){
      close_butts.splice(i, 1);
    }
  }  
}

function is_closed_butt(butt){
  return close_butts.findIndex(b => b.x == butt.x && b.y == butt.y) > -1;
}

function is_closed_butt_tmp(screen, x, y, checked_cells)
{
  //console.log(checked_cells.length);

  checked_cells.push({x, y});

  if ('A'.includes(screen[x][y])) return false;
  if ('*:+#O'.includes(screen[x][y])) return true;
  
  //иначе пустая ячейка
  var is_closed = true;

  var new_x = x;
  var new_y = y-1;

  var index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x;
  new_y = y+1;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x-1;
  new_y = y;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x+1;
  new_y = y;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  return is_closed;
 
}

function afraid_of_stones(screen, graph, self_x, self_y){ 

  var new_stones = [];
  for (let x = 0; x<screen_height; x++)
  {	
    let row = screen[x];
    for (let y = 0; y<row.length; y++)
    {
      if ('O*'.includes(screen[x][y]))         
        new_stones.push({x,y});
    }
  }

  if (stones.length == 0) {
    stones = new_stones;
    return;
  }
      

  var falling_stones = [];
  for (var i = 0; i < new_stones.length; ++i){

    var x = new_stones[i].x;
    var y = new_stones[i].y;

    var isFalling = false;

    //под ним пусто. упадет на этот ход    
    if (screen[x+1][y]==' '){  
      graph.grid[x+1][y].weight = 0;    
      if(x < screen_height - 2 && screen[x+2][y] != 'A'){
        graph.grid[x+2][y].weight = 0;    
      }   
      isFalling = true;   
    }   

    var isDangerousBottom = screen[x+1][y] =='+' || screen[x+1][y] =='O' || screen[x+1][y] =='*';

    //падает влево
    if (isDangerousBottom && x < screen_height - 1 && y > 0 && 
      screen[x][y-1]==' ' && screen[x+1][y-1]==' ' && screen[x+1][y] != ' ' && screen[x+1][y] != 'A'){
        graph.grid[x+1][y-1].weight = 0;   
        isFalling = true;           
    }
    //падает вправо
    if (isDangerousBottom && x < screen_height - 1 && y < screen[x].length - 1 && 
      screen[x][y+1]==' ' && screen[x+1][y+1]==' ' && screen[x+1][y] != ' ' && screen[x+1][y] != 'A'){
        graph.grid[x+1][y+1].weight = 0;  
        isFalling = true;          
    }

    if (!isFalling && screen[x][y]=='O'){
      var canMoveLeft = self_x == x && self_y - y == 1 &&
        y > 0 && screen[x][y-1] == ' ';
     
      var canMoveRight = self_x == x && self_y - y == -1 && 
        y < screen[x].length-1 && screen[x][y+1] == ' ';
     
      if (canMoveLeft || canMoveRight){
        graph.grid[x][y].weight = 1;  
      }      
      
    }

    //падал на прошлом ходу
    var isStableStone = false;
    for (var j = 0; j < stones.length; ++j){
      if (stones[j].x == new_stones[i].x && stones[j].y == new_stones[i].y){
        isStableStone = true;
        break;
      }
    }
    if (!isStableStone){
      falling_stones.push(new_stones[i]);
    }         

  } 

  for (var i = 0; i < falling_stones.length; ++i){
    var x = falling_stones[i].x;
    var y = falling_stones[i].y;

    if (x == screen_height - 1) continue;
     
    if (screen[x+1][y]=='A'){  //я под падающим камнем. нельзя идти наверх    
      graph.grid[x][y].weight = 0; 
    }
  }

  stones = new_stones; 
}

function set_trap_diamonds(diamonds, screen, graph){
  for (var i = 0; i < diamonds.length; ++i){
    var diamond = diamonds[i];
    if (is_trap(diamond, screen)){
      graph.grid[diamond.x][diamond.y].weight = 0;
    }
  }
}

function is_trap(diamond, screen){
  var x = diamond.x;
  var y = diamond.y;

  if (x <= 1) return false;
  if (!' *:'.includes(screen[x-1][y])) return false;

  x -=2;
  y = y;

  while (true){
    if (' '.includes(screen[x][y])){
      x--;
    }
    else if ('*O'.includes(screen[x][y])){
      break;
    }
    else {
      return false;
    }
  }

  x = diamond.x;
  y = diamond.y;

  while (' *:'.includes(screen[x][y])){
    if (' :'.includes(screen[x][y-1])) return false;
    if ('O'.includes(screen[x][y-1]) && y >= 2 && ' '.includes(screen[x][y-2])) return false;

    if (' :'.includes(screen[x][y+1])) return false; 
    if ('O'.includes(screen[x][y+1]) && y <= screen[x].length - 3 && ' '.includes(screen[x][y+2])) return false;
    
    x++;
  }

  return true;
}


//function play(screen){
exports.play = function*(screen){
    while (true){			   

    screen_height = screen.length - 1;
  
    let {x, y} = find_player(screen);    

    var graph = init_graph(screen);

    var start = graph.grid[x][y];

    var nearest_corner = get_nearest_corner(x, y, screen);
        
    //Чтобы на нас не упал камень
    afraid_of_stones(screen, graph, x, y)
    
    //боимся бабочек
    var butts = find_targets('/|-\\', screen);
    if (close_butts == undefined) close_butts = butts;
    check_closed_butts(screen);
    console.log("\n");
    console.log(close_butts.length);
    afraid_of_butterfly(screen, graph, start, butts);   

    var shortest_path = get_shortest_path(start, close_butts, graph);

    var diamonds = find_targets('*', screen);
    set_trap_diamonds(diamonds, screen, graph);

    //var shortest_path = undefined;
    if (shortest_path == undefined){
      shortest_path = get_shortest_path(start, diamonds, graph);
    }   
  
    
    if (shortest_path == undefined){
      console.log("No appropriate diamonds 1");    
      
      var shortest_path = get_path_to_kill_butt(butts, screen, graph, start);     

      if (shortest_path == undefined){      
        diamonds = find_targets(':', screen);
        set_trap_diamonds(diamonds, screen, graph);
        var shortest_path = get_shortest_path(start, diamonds, graph);
      }
    }


    if (shortest_path != undefined){

      console.log("\n");
      for (let i = 0; i<screen_height; i++){
        var res ="";
        for (let j = 0; j<screen[i].length; j++) {
          if (x == i && y == j){
            res += "A";
          }
          else if (shortest_path.findIndex(p=> p.x == i && p.y == j) > -1){
            res += "-";
          }       
          else {
            res += graph.grid[i][j].weight;
          }
        
        }
        console.log(res);
      }		 
    }

    var move= '';
    if (shortest_path != undefined){
      
      var first_step = shortest_path[0];
      if (first_step.y < y)
        move= 'l';
      else if (first_step.y > y)
        move= 'r';
      else if (first_step.x < x)
        move= 'u';
      else if (first_step.x > x)
        move= 'd';	
      else throw "Strange move";      
    }
    yield move;




    
    // console.clear();

    // console.log("/n");
    // console.log(move);

    // for (var i=0; i < result.length; ++i){
    //   console.log(result[i].x +" " + result[i].y);
    // }
        
      
    }
};































function pathTo(node) {
  var curr = node;
  var path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap(function(node) {
    return node.f;
  });
}

var astar = {
  /**
  * Perform an A* Search on a graph given a start and end node.
  * @param {Graph} graph
  * @param {GridNode} start
  * @param {GridNode} end
  * @param {Object} [options]
  * @param {bool} [options.closest] Specifies whether to return the
             path to the closest node if the target is unreachable.
  * @param {Function} [options.heuristic] Heuristic function (see
  *          astar.heuristics).
  */
  search: function(graph, start, end, options) {
    graph.cleanDirty();
    options = options || {};
    var heuristic = options.heuristic || astar.heuristics.manhattan;
    var closest = options.closest || false;

    var openHeap = getHeap();
    var closestNode = start; // set the start node to be the closest if required

    start.h = heuristic(start, end);
    graph.markDirty(start);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        return pathTo(currentNode);
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node.
      var neighbors = graph.neighbors(currentNode);

      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        var gScore = currentNode.g + neighbor.getCost(currentNode);
        var beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);
          if (closest) {
            // If the neighbour is closer than the current closestNode or if it's equally close but has
            // a cheaper path than the current closest node then it becomes the closest node
            if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
              closestNode = neighbor;
            }
          }

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    if (closest) {
      return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return [];
  },
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristics: {
    manhattan: function(pos0, pos1) {
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return d1 + d2;
    },
    diagonal: function(pos0, pos1) {
      var D = 1;
      var D2 = Math.sqrt(2);
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    }
  },
  cleanNode: function(node) {
    node.f = 0;
    node.g = 0;
    node.h = 0;
    node.visited = false;
    node.closed = false;
    node.parent = null;
  }
};

/**
 * A graph memory structure
 * @param {Array} gridIn 2D array of input weights
 * @param {Object} [options]
 * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
 */
function Graph(gridIn, options) {
  options = options || {};
  this.nodes = [];
  this.diagonal = !!options.diagonal;
  this.grid = [];
  for (var x = 0; x < gridIn.length; x++) {
    this.grid[x] = [];

    for (var y = 0, row = gridIn[x]; y < row.length; y++) {
      var node = new GridNode(x, y, row[y]);
      this.grid[x][y] = node;
      this.nodes.push(node);
    }
  }
  this.init();
}

Graph.prototype.init = function() {
  this.dirtyNodes = [];
  for (var i = 0; i < this.nodes.length; i++) {
    astar.cleanNode(this.nodes[i]);
  }
};

Graph.prototype.cleanDirty = function() {
  for (var i = 0; i < this.dirtyNodes.length; i++) {
    astar.cleanNode(this.dirtyNodes[i]);
  }
  this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
  this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
  var ret = [];
  var x = node.x;
  var y = node.y;
  var grid = this.grid;

  // West
  if (grid[x - 1] && grid[x - 1][y]) {
    ret.push(grid[x - 1][y]);
  }

  // East
  if (grid[x + 1] && grid[x + 1][y]) {
    ret.push(grid[x + 1][y]);
  }

  // South
  if (grid[x] && grid[x][y - 1]) {
    ret.push(grid[x][y - 1]);
  }

  // North
  if (grid[x] && grid[x][y + 1]) {
    ret.push(grid[x][y + 1]);
  }

  if (this.diagonal) {
    // Southwest
    if (grid[x - 1] && grid[x - 1][y - 1]) {
      ret.push(grid[x - 1][y - 1]);
    }

    // Southeast
    if (grid[x + 1] && grid[x + 1][y - 1]) {
      ret.push(grid[x + 1][y - 1]);
    }

    // Northwest
    if (grid[x - 1] && grid[x - 1][y + 1]) {
      ret.push(grid[x - 1][y + 1]);
    }

    // Northeast
    if (grid[x + 1] && grid[x + 1][y + 1]) {
      ret.push(grid[x + 1][y + 1]);
    }
  }

  return ret;
};

Graph.prototype.toString = function() {
  var graphString = [];
  var nodes = this.grid;
  for (var x = 0; x < nodes.length; x++) {
    var rowDebug = [];
    var row = nodes[x];
    for (var y = 0; y < row.length; y++) {
      rowDebug.push(row[y].weight);
    }
    graphString.push(rowDebug.join(" "));
  }
  return graphString.join("\n");
};

function GridNode(x, y, weight) {
  this.x = x;
  this.y = y;
  this.weight = weight;
}

GridNode.prototype.toString = function() {
  return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
  // Take diagonal weight into consideration.
  if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
    return this.weight * 1.41421;
  }
  return this.weight;
};

GridNode.prototype.isWall = function() {
  return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};


var stones = [];
var screen_height = 0;
var close_butts=undefined;

var CORNER_TYPE={
  LD:1,
  LT:2,
  RT:3,
  RD:4
};

//  var screen = 
//  ["A     ", 
//   " :::: ",
//   " :/ : ",
//   " :: : ",
//   "   + *"]; 
 
//  play(screen);



