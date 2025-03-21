class SharedState:
    def __init__(self):
        self.latest_message = None
        self.latest_distance = None
        self.latest_distance_timestamp = None

shared_state = SharedState()