module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 22.6886, longitude: 75.8676 },
  }),
  Accuracy: { Balanced: 3 },
};
