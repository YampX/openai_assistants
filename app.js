import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import OpenAIAPI from 'openai';
import connectToDatabase from './db';
import ActiveThread from './models/activeThreadModel';

dotenv.config();
connectToDatabase();

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAIAPI();

app.use(bodyParser.json());

app.post('/ask', async (req, res) => {
  try {
    const { userId, question } = req.body;

    if (!userId || !question) {
      return res.status(400).json({ error: 'UserId y pregunta son obligatorios.' });
    }

    // Buscar si hay un hilo activo para este usuario en la base de datos
    const existingThread = await ActiveThread.findOne({ userId });

    let threadId;

    if (existingThread) {
      // Si ya hay un hilo, utiliza ese hilo
      threadId = existingThread.threadId;
    } else {
      // Si no hay un hilo, crea uno nuevo y guarda la información en la base de datos
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      await ActiveThread.create({ userId, threadId });
    }

    // Agrega el mensaje del usuario al hilo
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: question,
    });

    // Crea un nuevo run en el hilo
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    // Espera la finalización del run y obtiene la respuesta
    const response = await waitForRunCompletion(threadId, run.id);
    res.json({ answer: response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

const waitForRunCompletion = async (threadId, runId) => {
  let runStatus;
  do {
    await delay(1000);
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  } while (runStatus.status !== 'completed');

  // Obtiene los mensajes del asistente y los concatena
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessages = messages.data.filter((msg) => msg.role === 'assistant');
  return assistantMessages.map((msg) => msg.content[0].text.value).join('\n');
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
