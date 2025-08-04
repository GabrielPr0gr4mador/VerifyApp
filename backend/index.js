const express = require("express");
const multer  = require("multer");
const { execFile } = require("child_process");
const {promisify} = require("util");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto")

const {
    generateKeyPair,
    createSign,
    createVerify,
} = require("node:crypto");
const { timeStamp } = require("node:console");
const { isNumberObject } = require("node:util/types");

const execFileAsync = promisify(execFile);
const app = express();

//Upload para pasta de armazenamento das imagens
const upload = multer({
    dest: "pictures/",
    limits: {
        fileSize: 50* 1024* 1024
    }
});


let publicKey, privateKey;

//Se a pasta não existir tenta criar, se já existir lança o console
(async () => {
    try {
        await fs.promises.mkdir("pictures");
    } catch (error) {
        console.log("A pasta para pictures não foi criada ou já existe", error);
    }
});


//Geração de par de chaves públicas e privadas com crypto 
generateKeyPair("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: "spki",
        format: "pem", //chave em base 64 
    },
    privateKeyEncoding: {
        type: "pkcs8", // Padrão de criptografia 8 
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "Crypto1@"
    },
}, (err, pubKey, privKey) => {

    if (err) {
        console.error("Erro ao gerar chaves:", err);
        return;
    }

    publicKey = pubKey;
    privateKey = privKey;
    console.log("Chaves geradas com sucesso");
});


async function cleanFile(filePath){
    try {
        await fs.promises.unlink(filePath);
    } catch (error){
        console.log("Erro ao limpar arquivo:", error);
    }
}

app.post("/sign-image", upload.single("image"), async (req, res) => {
    let inputPath = null;
  

    try {
    if (!req.file){
        return res.status(400).json({error: "Imagem não enviada para assinatura"});
    }

    inputPath = req.file.path;
   

    const imageBuffer = await fs.promises.readFile(inputPath);
    const imageBase64 = imageBuffer.toString("base64");

    const timeStamp = new Date().toISOString(); //data e hora iso internacional formato 
    const dataToSign = `${imageBase64}${timeStamp}`;
    
    //assinatura da imagem seus metadados e o timestamp inserido nela 

    const sign = createSign("SHA256");
    sign.write(dataToSign);
    sign.end();
    const signature = sign.sign({
        key: privateKey,
        passphrase: "Crypto1@"
    }, "hex");

    // criar um hash para cada assinatura/geração de chaves e injetar na imagem
    //cria o hash a partir da assinatura e converte em hexadecimal 64 digitios 

    const signatureHash = crypto.createHash("sha256").update(signature).digest("hex").substring(0, 64);

    // usar ExifTool para injetar a assinatura nos metadados da imagem, padrao exif dados de img

    const exifToolPutting = [
    '-overwrite_original',
    
    // EXIF padrão que existem
    `-EXIF:ImageDescription=VerifyApp:${signature}`, // Assinatura truncada
    `-EXIF:Software=VerifyApp v1.0`,
    `-EXIF:Artist=VerifyApp`, // AuthenticatedBy
    `-EXIF:Copyright=Signed:${timeStamp}`, 
    `-EXIF:UserComment=${signatureHash}`, 
    
    inputPath 
];

    await execFileAsync("exiftool", exifToolPutting);

    //verificar se  arquivo output foi criado

    try {
        await fs.promises.access(inputPath);
    } catch (error) {
        throw new Error("Falha ao processar/alterar metadados");
    }

    const readImageBuffer = await fs.promises.readFile(inputPath);

    //cabeçalho com informações importantes para o front
    res.set({
        'Content-Type': req.file.mimetype || 'image/jpg',
            /*'Content-Length': readImageBuffer.length,*/
            'X-Image-Signed': 'true',
            'X-Signature-Timestamp': timeStamp,
            'X-Signature-Hash': signatureHash
    });

    res.send(readImageBuffer);
} catch (error) {
    console.error("Erro ao processar imagem:", error);
} finally {
    if (inputPath) await cleanFile(inputPath);
    console.log("Quero um estágio");
}
});


//post para devolver tudo alterado assinado etc

app.post("/verify", upload.single("image"), async (req, res) => {
    let inputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "A imagem não foi enviada"});
        }

        inputPath = req.file.path;
        console.log("Arquivo recebido do frontend");

        const checkExif = [
            '-EXIF:all',
            '-json',
            inputPath
        ]

        const { stdout: allExifData } = await execFileAsync('exiftool', checkExif);
        const allMetadata = JSON.parse(allExifData)[0];
        console.log("Todos os metadados EXIF:", allMetadata);

        const exifToolData = [
            '-EXIF:ImageDescription',    // Assinatura 
            '-EXIF:Software',           // Software usado
            '-EXIF:Artist',             // AuthenticatedBy
            '-EXIF:Copyright',          // Timestamp
            '-EXIF:UserComment',        // Hash da assinatura
            '-json',
            inputPath
        ];

        const { stdout } = await execFileAsync('exiftool', exifToolData);
        const metadata = JSON.parse(stdout)[0];

        const signature = metadata.ImageDescription || metadata.Signature;
        const timeStamp = metadata.Copyright || metadata.SignatureTimestamp;
        const storedHash = metadata.UserComment || metadata.SignatureHash;
        const authenticatedBy = metadata.Artist || metadata.AuthenticatedBy;
        const software = metadata.Software;

        if (!signature) {
            return res.json({
                verified: false,
                message: "A imagem não possui assinatura"
            });
        }

        const imageBuffer = await fs.promises.readFile(inputPath);
        const imageBase64 = imageBuffer.toString("base64");
        const dataToVerify = `${imageBase64}${timeStamp}`;

        const verify = createVerify("SHA256");
        verify.update(dataToVerify);
        verify.end();
       
        let isValid = false;
        try {
            isValid = verify.verify(publicKey, signature, "hex");
        } catch (verifyError) {
            console.error("Erro na verificação de assinatura");
        }

        let hashMatch = true;
        if (storedHash) {
            const hash = crypto.createHash("sha256").update(signature).digest("hex").substring(0, 64);
            hashMatch = hash === storedHash;
        }

        const isVerified = isValid && hashMatch;

        res.json({
            verified: isVerified,
            timestamp: timeStamp,
            authenticatedBy: authenticatedBy,
            signatureHash: storedHash,
            hashMatch: hashMatch,
            message: isVerified ? "Imagem autenticada" : "Assinatura inválida"
        });

    } catch (error){
        console.error("Erro ao verificar imagem: ", error);
        res.status(500).json({
            error: "Erro",
            details: error.message
        });
    } finally {
        if (inputPath) {
            try {
                await cleanFile(inputPath);
            } catch (error) {
                console.error("Erro ao limpar path: ", error);
            }
        }
    }
});

//verificação se está rodando/ recomendação que achei 

app.get('/health', async (req, res) => {
    try {
        await execFileAsync('exiftool', ['-ver']);
        res.json({ 
            status: 'OK', 
            exiftool: 'Installed',
            keys: publicKey ? 'Generated' : 'Not Ready'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            exiftool: 'Not Installed',
            message: 'Execute: sudo apt-get install libimage-exiftool-perl (Ubuntu) ou brew install exiftool (Mac)'
        });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
    console.log('Verifique /health para status do ExifTool');
});