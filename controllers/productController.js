import { Product } from "../models";
import multer from 'multer';
import path from 'path';
import CustomErrorHandler from "../services/CustomErrorHandler";
import Joi from 'joi';
import fs from 'fs';
import productSchema from "../validators/productValidator";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const hasndleMultipartData = multer({ storage, limits: { fileSize: 1000000 * 5 } }).single('image');

const productController = {
    async store(req, res, next) {
        // Multipart form data
        hasndleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }
            const filePath = req.file.path;

            // Validation
            const { error } = productSchema.validate(req.body);
    
            if (error) {
                // Delete the uploaded file
                fs.unlink(`${appRoot}/${filePath}`, (err) => {
                    if (err) {
                        return next(CustomErrorHandler.serverError(err.message));
                    }
                });

                return next(error);
            }

            const { name, price, size } = req.body;

            let document;

            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath
                });
            } catch (error) {
                return next(error);
            }

            res.status(201).json(document);
        })
    },
    async update(req, res, next) {
        // Multipart form data
        hasndleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }

            let filePath;
            if (req.file) {
                filePath = req.file.path;
            }
            
            // Validation
            const { error } = productSchema.validate(req.body);
    
            if (error) {
                if (req.file) {
                    // Delete the uploaded file
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if (err) {
                            return next(CustomErrorHandler.serverError(err.message));
                        }
                    });
                }

                return next(error);
            }

            const { name, price, size } = req.body;

            let document;

            try {
                document = await Product.findOneAndUpdate({ _id: req.params.id },{
                    name,
                    price,
                    size,
                    ...(req.file && { image: filePath })
                }, { new: true });
            } catch (error) {
                return next(error);
            }

            res.status(201).json(document);
        })
    },
    async destroy(req, res, next) {
        try {
            const document = await Product.findOneAndRemove({ _id: req.params.id });
            if (!document) {
                return next(new Error('Nothing to delete'));
            }
            // image deletion
            const imagePath = document._doc.image;
            fs.unlink(`${appRoot}/${imagePath}`, (err) => {
                if (err) {
                    return next(CustomErrorHandler.serverError());
                }
                return res.json(document);
            });
        } catch (error) {
            return next(error);
        }
    },
    async list(req, res, next) {
        try {
            const documents = await Product.find().select('-updatedAt -__v').sort({ createdAt: -1 });
            return res.json(documents);
        } catch (error) {
            return next(error);
        }
    },
    async show(req, res, next) {
        try {
            const document = await Product.findOne({ _id: req.params.id }).select('-updatedAt -__v');
            return res.json(document);
        } catch (error) {
            return next(error);
        }
    }
}

export default productController;