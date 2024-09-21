const express = require("express");

const util = require("util");
const execPromise = util.promisify(require("child_process").exec);
const { spawn, exec } = require("child_process");
const fs = require("fs");

const app = express();

const port = process.env.PORT || 5000;

app.listen(port , (req,res)=>{
	console.log("Server is running on port ", port);
});

app.get("", (req,res)=>{
	console.log("Linux");
	res.send("Linux\n");
})

const exec_cmd = ()=>{
	exec(`git clone https://github.com/AhmedSherif2002/test_h2.git ~/available-apps/app2`, (err, stdout, stderr)=>{
		if(err) console.log(err)
		console.log(stdout);
		console.log(stderr);

	})
}

const spawn_cmd = ()=>{
	const clone = exec(`sleep 2 && echo 1 && sleep 2 && echo 2`);
	clone.stdout.on("data", (data)=>{
		console.log("a:",data.toString());
	})
	clone.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	  });
	  
	clone.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	  });
}

// start cloning and build instance.

const async_exec_cmd = (repo, app)=>{
	fs.access("../available-apps/app2", (err)=>{
		if(err){
			console.log("doesn't exist");
			cloneRepo();
		}
		else{
			console.log("exists");
			fs.rm("../available-apps/app2", { recursive: true, force: true }, err=>{
				if(err){
					console.log(err)
					return;
				} 
				removeContainers("app2");
				cloneRepo();
			});
		}
	})
}

const cloneRepo = ()=>{
	execPromise(`git clone https://github.com/AhmedSherif2002/test_h2.git ~/available-apps/app2`).then(({ stdout, stderr })=>{
		console.log(stdout);
		console.log(stderr);
		console.log("done clone");
		dockerfileContent = `
			FROM node
			WORKDIR /
			COPY package.json ./
			RUN npm install
			COPY . .
			CMD ["node", "app.js"]
		`
		fs.writeFile(`../available-apps/app2/Dockerfile`, dockerfileContent, err=>{
			if(err){
				console.log(err);
			}
			console.log("docker file created")

			const dockerImageBuild = exec(`sudo docker build -t app2 ~/available-apps/app2/`);
			let output = ''
			let c = 0;
			console.log("Building docker image...");
			dockerImageBuild.stdout.on("data", (data)=>{
				output += data.toString().trim();
				// console.log("a:",data);
			})
			dockerImageBuild.stderr.on('data', (data) => {
				// console.error(`stderr: ${data.trim()}`);
			});
			dockerImageBuild.on('close', (code) => {
				console.log(output,"\nDone \n");
				console.log(`child process exited with code ${code}`);
				execPromise(`sudo docker run -d -p 3200:3300 app2`).then(({ stdout, stderr })=>{
					console.log(stderr);
					console.log(stdout);
				}).catch(err=>console.log(err))
			});
			
		})
	}).catch(err=>console.log(err));
}

const removeContainers = (appName)=>{
	execPromise(`sudo docker ps -a | grep ${appName} | awk '{ print $1 }'`).then(({ stdout, stderr })=>{
		console.log("Container:",stdout);
		// const container = stdout;
		if(!stdout) return;
		execPromise(`sudo docker rm -f ${stdout}`).then(({ stdout, stderr })=>{
			if(stderr)	console.log(stderr)
			console.log("container was removed",stdout);
			execPromise(`sudo docker rmi -f ${appName}`).then(({ stdout, stderr })=>{
				if(stderr)	console.log(stderr)
				console.log("Image was removed",stdout);
			}).catch(err=>console.log(err));
		}).catch(err=>console.log(err));

	}).catch(err=>console.log(err));
}

const removeImages = ()=>{

}

// exec_cmd();
// spawn_cmd()
async_exec_cmd();

