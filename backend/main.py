import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SmoothDronePhysics:
    def __init__(self):
        self.x = 0.0
        self.y = 1.0
        self.z = 0.0
        
        self.vx = 0.0
        self.vy = 0.0
        self.vz = 0.0
        
        self.damping = 0.92      # Friction drag
        self.acceleration = 0.08 # Smooth velocity curve

    def update_physics(self, inputs):
        # Apply Directional Forces
        if inputs.get("forward"):
            self.vz -= self.acceleration
        if inputs.get("backward"):
            self.vz += self.acceleration
        if inputs.get("left"):
            self.vx -= self.acceleration
        if inputs.get("right"):
            self.vx += self.acceleration
        if inputs.get("up"):
            self.vy += self.acceleration
        if inputs.get("down"):
            self.vy -= self.acceleration

        # Apply Damping Drag
        self.vx *= self.damping
        self.vy *= self.damping
        self.vz *= self.damping

        # Integrate Positions
        self.x += self.vx
        self.y += self.vy
        self.z += self.vz

        # Floor Constraint
        if self.y < 0.1:
            self.y = 0.1
            self.vy = 0.0

drone_state = SmoothDronePhysics()

@app.websocket("/ws/drone")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    current_inputs = {}

    try:
        while True:
            # Drain socket messages non-blockingly
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.016)
                if data:
                    current_inputs = json.loads(data)
            except asyncio.TimeoutError:
                pass

            # Step physics frame
            drone_state.update_physics(current_inputs)

            # Send telemetry update
            await websocket.send_json({
                "position": {"x": drone_state.x, "y": drone_state.y, "z": drone_state.z},
                "velocity": {"x": drone_state.vx, "y": drone_state.vy, "z": drone_state.vz},
                "rotation": {"x": 0, "y": 0, "z": 0}
            })

            await asyncio.sleep(0.016) # ~60 FPS update rate

    except (WebSocketDisconnect, RuntimeError):
        pass