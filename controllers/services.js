import ServiceModel from '../models/services.js';
import UserModel from '../models/users.js';

export const getAllServices = async (req, res) => {
    try {
        const services = await ServiceModel.find();
        res.send(services);
    } catch (error) {
        res.status(500).send("Unable to get all services");
    }
};

export const getService = async (req, res) => {
    try {
        const service = await ServiceModel.findById(req.params.id).populate('serviceProviders', ['name', 'email', 'profileImage', 'city']);
        if (!service) {
            res.status(400).send("Service not found");
            return;
        }
        res.send(service);
    } catch (error) {
        res.send(error);
    }
};

export const serviceNotInUser = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).populate('services');
        if (!user) {
            res.status(400).send("User not found");
            return;
        }

        if (!user.services) {
            res.send("User has no services");
            return;
        }

        const servicesNotInUser = await ServiceModel.find({
            _id: { $nin: user.services.map(service => service._id) }
        });

        res.send(servicesNotInUser);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}

export const deleteService = async (req, res) => {
    try {
        const service = await ServiceModel.findByIdAndDelete(req.params.id);
        if (!service) {
            res.status(400).send('No such service exists');
            return;
        }
        res.send(`${service.name} has been deleted`);
    } catch (error) {
        res.send(error);
    }
};

export const addService = async (req, res) => {
    try {
        console.log(req.body);
        const result = new ServiceModel(req.body);
        await result.save();
        console.log(result);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
};

export const addUserToService = async (req, res) => {
    try {
        // Validate request data
        if (!req.params.id || !req.body.user) {
            res.status(400).send('Invalid request data');
            return;
        }

        const service = await ServiceModel.findById(req.params.id);
        const user = await UserModel.findById(req.body.user._id);

        if (!service) {
            res.status(404).send('Service not found');
            return;
        }

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        // Assuming req.body.user is an ObjectId or a user object
        if (!user.services) {
            user.services = []; // Initialize user.services if it's undefined
        }
        user.services.push(service._id);
        await user.save();

        if (!service.serviceProviders) {
            service.serviceProviders = [];
        }
        service.serviceProviders.push(req.body.user._id);
        const updatedService = await service.save();

        // Log the updated service before sending it back
        console.log(updatedService);

        // Send the updated service object as the response
        res.send(updatedService);
    } catch (error) {
        // Log the error for debugging
        console.error('Error adding user to service:', error);
        // Send an appropriate error response
        res.status(500).send('Internal Server Error');
    }
};

export const serviceOfferedByServiceProvider = async (req, res) => {
    try {
        const user = req.params.id;
        const userServices = await UserModel.findById(user).populate('services', ['name']);
        if (!userServices) {
            res.status(400).send("User not found");
            return;
        }
        res.send(userServices);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
}

export default { getAllServices, getService, addService, deleteService, addUserToService };
