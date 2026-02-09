import { Request, Response, Router } from "express";
import { ChangeProjectProperty, FetchProjects, FetchIndividualProject, NewProject } from "../controllers/projects.controller";
import { RenderProject, RenderStatus } from "../controllers/render.controller";

const renderrouter = Router()


renderrouter.post("/:id/", RenderProject);

renderrouter.get("/:id/renderstatus", RenderStatus);


export default renderrouter;