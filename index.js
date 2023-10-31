const request = require("request");
const lib = require('./lib/switch');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-solidmation-switch", "Solidmation-Switch", SolidmationSwitch);
};

class SolidmationSwitch {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    this.device = new lib.Device();
    this.characteristicManufacturer = this.device.getDeviceManufacturer();
    this.characteristicModel = this.device.getDeviceModel();
    this.characteristicSerialNumber = this.device.getSerialNumber();

    this.device.setHomeId(config.homeId);
    this.device.setDeviceId(config.deviceId);

    this.initDevice(config).catch(err => this.log(err));
  }

  async initDevice(config) {
    try {
      await this.device.login(config.email, config.password);
      const status = await this.device.getStatus();
      this.characteristicManufacturer = this.device.getDeviceManufacturer();
      this.characteristicModel = this.device.getDeviceModel();
      this.characteristicSerialNumber = this.device.getSerialNumber();
    } catch (err) {
      this.log('Error during device initialization:', err);
    }
  }

  identify(callback) {
    this.log("Identify requested!");
    callback();
  }

  async getEstado(callback) {
    try {
      const data = await this.device.getStatus();
      console.log('Data:', data); // This line is for debugging.
      if (typeof data.encendido === 'boolean') {
        callback(null, data.encendido);
      } else {
        this.log('Unexpected value for data.encendido:', data.encendido);
        callback(new Error('Unexpected value received'));
      }
    } catch (err) {
      this.log('Error in getEstado:', err);
      callback(err);
    }
  }  

  async setEstado(value, callback) {
    try {
      await this.device.switchSetStatus({ isOn: value });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  getName(callback) {
    this.log("getName :", this.name);
    callback(null, this.name);
  }

  getServices() {
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.characteristicManufacturer)
      .setCharacteristic(Characteristic.Model, this.characteristicModel)
      .setCharacteristic(Characteristic.SerialNumber, this.characteristicSerialNumber);

    const switchService = new Service.Switch(this.name);
    switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getEstado.bind(this))
      .on('set', this.setEstado.bind(this));

    return [informationService, switchService];
  }
}
