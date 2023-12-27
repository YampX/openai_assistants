// Importa Mongoose
import mongoose from 'mongoose';

// Define el esquema para los hilos activos
const activeThreadSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  threadId: { type: String, required: true },
});

// Crea el modelo 'ActiveThread' utilizando el esquema definido
const ActiveThread = mongoose.model('ActiveThread', activeThreadSchema);

// Exporta el modelo para su uso en otras partes de la aplicación
export default ActiveThread;
