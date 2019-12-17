/*jslint browser: true, indent: 3 */

// CS 3312, spring 2016
// Examples for Studio 7

// All the code below will be run once the page content finishes loading.
document.addEventListener('DOMContentLoaded', function () {
   'use strict';
   

 

   (function(){
   
      
      //Function to set up the canvas
      var setupCanvas;
      
      //Canvas Element Variable Declarations
      var drawingAppCanvas, drawingAppCtx;
      
      //Individual Tool Function Declarations
      var drawWithPencil, drawWithLineTool, drawWithRectangleTool, drawWithCircleTool, fillSelection, drawWithSpray, erase;
      
      //Coordinate Manipulation Variable Declarations
      var getPoint, lastPoint, firstPoint, createPoint;
      
      //Utility Declarations
      var undoHistory = [];
      var redoHistory = [];
	  
	  
	  
	  //Miscellaneous Function Declarations
	   var rgbToHex, isSameColor;
      
      //Booleans for Switching Between Tools
      var pencilToolActive = true;
      var lineToolActive = false;
      var eraserToolActive = false;
      var fillToolActive = false;
      var rectangleToolActive = false;
      var circleToolActive = false;
      var sprayToolActive = false;
      
      document.getElementById('pencil-tool').style.backgroundColor = "#428a44"
      
      //Get Canvas Object and Context. Also, check to make sure the browser supports the canvas.
      
      drawingAppCanvas = document.querySelector('#myCanvas');
      drawingAppCtx = drawingAppCanvas && drawingAppCanvas.getContext && drawingAppCanvas.getContext('2d');
      if (!drawingAppCtx){
         window.alert("Your browser does not seem to support this drawing application. Please use another browser.");
         return;
      }
      
      //-----------------------------------------Setting up the drawing area------------------------------------------------------
      
      drawingAppCanvas.width = 750;
      drawingAppCanvas.height = 500;
      
      document.querySelector('#stroke-size').value = 1;
      
       
      //Function definition for setting up the canvas.
      setupCanvas = function(previousDrawing){
         //If a previously saved drawing is passed to setupCanvas
         if (previousDrawing){
            //Draw the previously saved drawing on the canvas.
            var img = new Image();
            img.onload = function(){
               drawingAppCtx.drawImage(img, 0,0);
            }
            //Remove the previously saved drawing from local storage.
            img.src = localStorage.getItem('Canvas State');
            localStorage.removeItem('Canvas State');
         } else {
            //If no previously saved drawing is found, simply make the canvas blank.
            drawingAppCtx.fillStyle = '#ffffff';
            drawingAppCtx.fillRect(0, 0, drawingAppCanvas.width, drawingAppCanvas.height);
         }
      };
      
      //Check for a previously saved drawing
      if (localStorage && localStorage.getItem && localStorage.getItem('Canvas State')){
         //If one is found, ask user if they would like to load it.
         var loadWhich = confirm("You appear to have a previously saved drawing. Would you like to load it? \n (Cancel will delete the previously saved drawing.)");
            if (loadWhich === true){
               //If the user wishes to load the previously saved drawing, pass the image to setupCanvas, which will set up the new canvas using the image.
               setupCanvas(localStorage.getItem('Canvas State'));
            } else {
               //If the user does not wish to load the previously saved drawing, remove the image from local storage, and set up a blank canvas.
               setupCanvas();
               localStorage.removeItem('Canvas State');
            }
      } else{
         //If no previously saved drawing is found, simply set up a blank canvas.
         setupCanvas();
      }
	  
	  // undoHistory.push(drawingAppCtx.getImageData(0,0,drawingAppCanvas.width, drawingAppCanvas.height));
	  
      //-----------------------------------------Tool Function Definitions------------------------------------------------------
      
      //Function definition for Drawing with the Pencil
      drawWithPencil = function (event){
         var currentPoint = getPoint(event);
         drawingAppCtx.lineWidth = document.querySelector('#stroke-size').value;
         drawingAppCtx.lineCap = document.querySelector('#line-cap').value;
         drawingAppCtx.beginPath();
         drawingAppCtx.moveTo(lastPoint.x, lastPoint.y);
         drawingAppCtx.lineTo(currentPoint.x, currentPoint.y);
         drawingAppCtx.strokeStyle = document.querySelector('#color-picker').value;
         drawingAppCtx.stroke();
         lastPoint = currentPoint;
      };
      
      erase = function (event){
         var currentPoint = getPoint(event);
         drawingAppCtx.lineWidth = document.querySelector('#stroke-size').value;
         drawingAppCtx.lineCap = document.querySelector('#line-cap').value;
         drawingAppCtx.beginPath();
         drawingAppCtx.moveTo(lastPoint.x, lastPoint.y);
         drawingAppCtx.lineTo(currentPoint.x, currentPoint.y);
         drawingAppCtx.strokeStyle = '#ffffff';
         drawingAppCtx.stroke();
         lastPoint = currentPoint;
      };
      
      //Function definition for Drawing with the Line Tool
      drawWithLineTool = function (first, last){
         drawingAppCtx.lineWidth = document.querySelector('#stroke-size').value;
         drawingAppCtx.beginPath();
         drawingAppCtx.moveTo(first.x, first.y);
         drawingAppCtx.lineTo(last.x, last.y);
         drawingAppCtx.lineCap = document.querySelector('#line-cap').value;
         drawingAppCtx.strokeStyle = document.querySelector('#color-picker').value;
         drawingAppCtx.stroke();
      };
      
      //Function definition for drawing with the Rectangle Tool
      drawWithRectangleTool = function (first, last){
         drawingAppCtx.lineWidth = document.querySelector('#stroke-size').value;
         drawingAppCtx.beginPath();
         drawingAppCtx.moveTo(first.x, first.y);
         drawingAppCtx.lineTo(first.x - (first.x - last.x), first.y);
         drawingAppCtx.lineTo(first.x - (first.x - last.x), last.y);
         drawingAppCtx.lineTo(first.x, first.y + (last.y - first.y));
         drawingAppCtx.closePath();
         drawingAppCtx.strokeStyle = document.querySelector('#color-picker').value;
         drawingAppCtx.fillStyle = document.querySelector('#fill-color-picker').value
         drawingAppCtx.fill();
         drawingAppCtx.stroke();
      };
      
      //Function definition for drawing with the Circle Tool
      drawWithCircleTool = function (first, last){
      
         drawingAppCtx.beginPath();

         drawingAppCtx.arc(first.x, first.y, Math.sqrt((first.x - last.x) * (first.x - last.x) + (first.y - last.y) * (first.y - last.y)) , 0, 2 * Math.PI, false);
         drawingAppCtx.lineWidth = document.querySelector('#stroke-size').value;
         drawingAppCtx.strokeStyle = document.querySelector('#color-picker').value;
         drawingAppCtx.stroke();
         drawingAppCtx.fillStyle = document.querySelector('#fill-color-picker').value;
         drawingAppCtx.fill();
  
      };
      
      //Function definition for drawing with the Spray Tool
      
      drawWithSpray = function (event){
      
         var centerPoint;
         
         //Get the center point (mouse location)
         centerPoint = getPoint(event);
         
         //Returns an object containing random offset numbers to be used in calculating spray locations.
         var getRandomOffset = function (){
            var randomAngle = Math.random() * 360;
            //Radius of spray area is dependent on the user's stroke size.
            var randomRadius = Math.random() * document.querySelector('#stroke-size').value;
            
            return{
               x: Math.cos(randomAngle) * randomRadius,
               y: Math.sin(randomAngle) * randomRadius
            };
         }
         
         //place 1 x 1 px rects using the user's fill color in random locations around the center point
         for (var i = 0; i < 25; i++){
            
            var offset = getRandomOffset();
            var x = centerPoint.x + offset.x;
            var y = centerPoint.y + offset.y;

            drawingAppCtx.fillStyle = document.querySelector('#fill-color-picker').value;
            drawingAppCtx.fillRect(x, y, 1 + (Math.random() * 1), 1 + (Math.random() * 1));
          }
      };

	  fillSelection = function fillSelection (x, y, targetColor, replacementColor){
         
          var imgData;
         var pixelRgb;
         // This is a recursive Flood Fill algorithm.
         // Although it works, it is impractical
         // the time and data cost are too large for this to be of practical use.
         // it is recommended to only use the fill tool on small areas.
         
         // console.log('checking point: ('+x+','+y+')');
         
     
         
         if (targetColor === replacementColor){
            return;
           }
            
         imgData = drawingAppCtx.getImageData(x, y, 1, 1).data;
         pixelRgb = rgbToHex(imgData[0],imgData[1],imgData[2]);
            
         if (pixelRgb != targetColor){
            // drawingAppCtx.fillStyle = replacementColor;
            // drawingAppCtx.fillRect(x,y,1,1);
            return;
         }
          
  
         
         drawingAppCtx.fillStyle = replacementColor;
         drawingAppCtx.fillRect(x,y,1,1);
         
         fillSelection(x, y+1 ,targetColor, replacementColor);
         fillSelection(x, y-1 ,targetColor, replacementColor);
        
         fillSelection(x-1, y ,targetColor, replacementColor);
         fillSelection(x+1, y ,targetColor, replacementColor);
         
        
         
         
	   };
      
       
      
      
       //-----------------------------------------Handle Button Presses------------------------------------------------------

      document.querySelector('#pencil-tool').addEventListener('click', function(){
         
         
         pencilToolActive = true;
         lineToolActive = false;
         fillToolActive = false;
         eraserToolActive = false;
         rectangleToolActive = false;
         circleToolActive = false;
         sprayToolActive = false;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#428a44";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
      
      document.querySelector('#eraser-tool').addEventListener('click', function(){
      
         pencilToolActive = false;
         lineToolActive = false;
         fillToolActive = false;
         eraserToolActive = true;
         rectangleToolActive = false;
         circleToolActive = false;
         sprayToolActive = false;
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#428a44";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
      
      document.querySelector('#line-tool').addEventListener('click', function(){
	
         pencilToolActive = false;
         lineToolActive = true;
         fillToolActive = false;
         eraserToolActive = false;
         rectangleToolActive = false;
         circleToolActive = false;
         sprayToolActive = false;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#428a44";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
      
      document.querySelector('#rectangle-tool').addEventListener('click', function(){
	
         pencilToolActive = false;
         lineToolActive = false;
         fillToolActive = false;
         eraserToolActive = false;
         rectangleToolActive = true;
         circleToolActive = false;
         sprayToolActive = false;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#428a44";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
      
       document.querySelector('#circle-tool').addEventListener('click', function(){
	
         pencilToolActive = false;
         lineToolActive = false;
         fillToolActive = false;
         eraserToolActive = false;
         rectangleToolActive = false;
         circleToolActive = true;
         sprayToolActive = false;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#428a44";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
	  
	  document.querySelector('#fill-tool').addEventListener('click', function(){
	
         pencilToolActive = false;
         lineToolActive = false;
         fillToolActive = true;
         eraserToolActive = false;
         rectangleToolActive = false;
         circleToolActive = false;
         sprayToolActive = false;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#428a44";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#4CAF50";
      });
      
      document.querySelector('#spray-tool').addEventListener('click', function(){
	
         pencilToolActive = false;
         lineToolActive = false;
         fillToolActive = false;
         eraserToolActive = false;
         rectangleToolActive = false;
         circleToolActive = false;
         sprayToolActive = true;
         
         document.getElementById('pencil-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('eraser-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('line-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('rectangle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('fill-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('circle-tool').style.backgroundColor = "#4CAF50";
         document.getElementById('spray-tool').style.backgroundColor = "#428a44";
         
      });


        //-----------------------------------------Individual Tool Controls------------------------------------------------------
     (function(){
      //When the user clicks on the canvas
      drawingAppCanvas.addEventListener('mousedown', function(event) {
	  
		//save canvas state in undo history when a change is made, enable the undo button in case it was disabled.
         
		 undoHistory.push(drawingAppCtx.getImageData(0,0,drawingAppCanvas.width, drawingAppCanvas.height));
         document.querySelector('#undo').disabled = false;
        
		
		 document.querySelector('#redo').disabled = true;
         redoHistory = [];
         //draw with the pencil if the pencil button is currently active, same with Spray tool.
         if (pencilToolActive || sprayToolActive || eraserToolActive){
            //initialize the last point as the current mouse position
            lastPoint = getPoint(event);
            //When the user drags the mouse, execute the drawing functions
            if (pencilToolActive){
               document.addEventListener('mousemove', drawWithPencil, false);
            }
            if (sprayToolActive){
               document.addEventListener('mousemove', drawWithSpray, false);
            }
            if (eraserToolActive){
               document.addEventListener('mousemove', erase, false);
            }
         }

         //Since the shape tool methods are similar to each other, they all start out grabbing the first point
         //The only thing that changes is which function is aused
         //The tool places a mouse move listener that calls a function that "previews" the line being drawn, which is explained in the definitions.
         if (lineToolActive || rectangleToolActive || circleToolActive){

            firstPoint = getPoint(event);

            if (lineToolActive){
               document.addEventListener('mousemove', previewLine, false);
            }
            if (rectangleToolActive){
               document.addEventListener('mousemove', previewRect, false);
            }
            if (circleToolActive){
               document.addEventListener('mousemove', previewCircle, false);
            }
         }
         
         //FillSelection must be passed the image data of the pixel being clicked, therefore this is in a different if statement.
         if (fillToolActive){
            firstPoint = getPoint(event);
            console.log(firstPoint.color);
            var imageDataOfPoint = drawingAppCtx.getImageData(firstPoint.x, firstPoint.y, 1, 1).data;

            fillSelection(Math.floor(firstPoint.x), Math.floor(firstPoint.y), firstPoint.color, document.querySelector('#fill-color-picker').value);
         }
         
         
         
         
      }, false);
      
      //When the user stops dragging and releases the mouse button
      drawingAppCanvas.addEventListener('mouseup', function(event) {

         if (pencilToolActive){
            //stop drawing
            document.removeEventListener('mousemove', drawWithPencil, false);
         }
         
         if ( sprayToolActive){
            document.removeEventListener('mousemove', drawWithSpray, false);
         }
         
         if(eraserToolActive){
               document.removeEventListener('mousemove', erase, false);
            }
         
         //if the last two if statements weren't executed, it is assumed we are using a shape tool.
         //Comments on the lineToolActive if statement structure apply to the other shape tools.
         //place the current mouse position into last point (to use with the shape tools).
         lastPoint = getPoint(event);
         
         if (lineToolActive){
            //redraw the last undo history entry, this is to prevent an issue where two lines appearer to have been drawn
            drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
            //Draw place line onto canvas from first point to last point
            drawWithLineTool(firstPoint, lastPoint);
            //stop previewing the line
            document.removeEventListener('mousemove', previewLine, false);
         }

         if (rectangleToolActive){
			
            drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
			
            drawWithRectangleTool(firstPoint, lastPoint);
            document.removeEventListener('mousemove', previewRect, false);
         }
         
         if (circleToolActive){
            drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
            drawWithCircleTool(firstPoint, lastPoint);
            document.removeEventListener('mousemove', previewCircle, false);
         }
         
		 
		 
        // undoHistory.push(drawingAppCtx.getImageData(0,0,drawingAppCanvas.width, drawingAppCanvas.height));
		 
        //when the mouse is released, this means the user has drawn something new.
        //redo history is reset, and the button is disabled.
         
        
		
      }, false);
      
   })();
 
      //-----------------------------------------Utilities------------------------------------------------------
      
      //when the page is loaded, the undo and redo buttons are disabled since there is no undo or redo history yet.
      document.querySelector('#undo').disabled = true;
      document.querySelector('#redo').disabled = true;
      
      //When the undo button is pressed:
      document.querySelector('#undo').addEventListener('click', function(){
	  
		console.log(undoHistory.length);
         // if the undo history array length is greater than one:
         if (undoHistory.length > 0){
            //push the last canvas state into the redo history array.
            redoHistory.push(undoHistory[undoHistory.length - 1]);
            //Enable the redo button, since redo history now has content.
            document.querySelector('#redo').disabled = false;
            //draw the last canvas state in undo history.
            drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
            //Remove the last canvas state from undo history.
            undoHistory.pop();
         } else{
            //if undo history array length is 0, there is no undo history. disable the undo button.

            document.querySelector('#undo').disabled = true;
         }
      }, false);
      
      //Redo works the same as undo. The only difference is that redo history only receives data if the undo button is pressed.
      document.querySelector('#redo').addEventListener('click', function(){
		
		console.log(redoHistory.length);
         if (redoHistory.length > 0){
            undoHistory.push(redoHistory[redoHistory.length - 1]);
			drawingAppCtx.putImageData(redoHistory[redoHistory.length-1], 0, 0);
            document.querySelector('#undo').disabled = false;
            redoHistory.pop();
         } else{
			// drawingAppCtx.putImageData(redoHistory[redoHistory.length - 1], 0, 0);
            document.querySelector('#redo').disabled = true;
         }
      }, false);
      
      //Create a new window containing a savable image when the user presses export.
      document.querySelector('#export').addEventListener('click', function(){
          window.open(drawingAppCanvas.toDataURL(), 'Canvas snapshot');
      }, false);
      
      //Save a snapshot of the canvas into local storage when the user presses save.
      document.querySelector('#save').addEventListener('click', function(){
         localStorage.removeItem('Canvas State');
         localStorage.setItem("Canvas State", drawingAppCanvas.toDataURL());
      },false);
      
      //This function is used for converting the return value of getImageData into a hex number for comparing colors.
		rgbToHex = function (r, g, b) {
				return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		};
      
      //The preview functions are called when the mouse button is down and moving.
      //Every time the mouse moves, the last undo history entry is redrawn and 
      //desired shape is drawn. When the mouse moves, this process repeats,
      //creating the illusion that the shape is moving with the users
      //mouse, and allowing the user to preview their shape before committing to it.
      var previewLine = function(coord){
         drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
         drawWithLineTool(firstPoint, getPoint(coord));
      };
            
      var previewRect = function(coord){
         drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
         drawWithRectangleTool(firstPoint, getPoint(coord));
      };
      
      var previewCircle = function(coord){
         drawingAppCtx.putImageData(undoHistory[undoHistory.length - 1], 0, 0);
         drawWithCircleTool(firstPoint, getPoint(coord));
      };
      
      //Returns an object containing the mouse position
      getPoint = function(event){
         var rect, coordX, coordY;
         rect = drawingAppCanvas.getBoundingClientRect();
         coordX = event.clientX - rect.left;
         coordY = event.clientY - rect.top;
         
         return {
            x: Math.floor(coordX),
            y: Math.floor(coordY),
            color: rgbToHex(drawingAppCtx.getImageData(coordX, coordY, 1, 1).data[0], drawingAppCtx.getImageData(coordX, coordY, 1, 1).data[1], drawingAppCtx.getImageData(coordX, coordY, 1, 1).data[2])
         };
      };

   }());

}, false);
