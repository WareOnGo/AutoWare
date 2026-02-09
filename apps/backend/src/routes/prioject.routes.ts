import { Request, Response, Router } from "express";
import { ChangeProjectProperty, FetchProjects, FetchIndividualProject, NewProject } from "../controllers/projects.controller";

const projectrouter = Router()

projectrouter.post("/new", NewProject); // needs presigned url

projectrouter.get("/fetch", FetchProjects);

projectrouter.get("/fetch/:i", FetchIndividualProject);

projectrouter.put("/change/:i", ChangeProjectProperty);

export default projectrouter;