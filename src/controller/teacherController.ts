import { Request, Response } from "express";
import { pool } from "../database/db";
import fs from "fs";
import {
  createSchemaValidation,
  deleteParamsSchema,
  paginationQuery,
  updateSchemaValidation,
} from "../validation/zodSchema";
import { QueryResult } from "pg";
import path from "path";
import { Teacher } from "../types";

const getTeacher = async (req: Request, res: Response) => {
  //db connection
  const connection = await pool.connect();
  let limit = 10;
  let page = 1;
  //validate quey params
  const parseQuery = paginationQuery.safeParse(req.query);
  if (parseQuery.success) {
    //if query params is there update default page and limit
    limit = parseQuery.data.limit;
    page = parseQuery.data.page;
  }
  const count = await connection.query(`
    SELECT T.ID,T.NAME,T.EMAIL,T.PROFILE,TF.FEE
    FROM TEACHERS T
    JOIN TEACHERFEE TF ON T.ID = TF.T_ID
    WHERE T.ID IN (
        SELECT T_ID
        FROM STUDENTS
        GROUP BY T_ID
        HAVING COUNT(ID) > 5
    ) AND TF.FEE > 15000
  `);
  res.status(200).json({
    teachers: count.rows,
  });
};

const createTeacher = async (req: Request, res: Response) => {
  try {
    //db connection
    const connection = await pool.connect();

    //validate body
    const parseBody = createSchemaValidation.safeParse(req.body);
    if (!parseBody.success) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "please pass valid body" });
    }

    //chek if teacher with mail alredy exist
    const exist = await connection.query(
      `SELECT ID FROM TEACHERS WHERE EMAIL = $1`,
      [parseBody.data.email]
    );
    if (exist.rowCount) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res
        .status(409)
        .json({ message: "teacher with this email is already exist" });
    }

    //create teacher
    const teacher = await connection.query(
      `INSERT INTO TEACHERS (NAME,EMAIL,PROFILE) VALUES ($1,$2,$3)`,
      [
        parseBody.data.name,
        parseBody.data.email,
        !req.file ? "default.png" : req.file.filename,
      ]
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    if (req.file) {
      await fs.unlinkSync(req.file.path);
    }
    res.sendStatus(500);
  }
};

const deleteTeacher = async (req: Request, res: Response) => {
  const connection = await pool.connect();
  //validate params
  const parsParams = deleteParamsSchema.safeParse(req.params);
  if (!parsParams.success) {
    return res.status(400).json({ message: "please pass valid params" });
  }
  //find student with this id if not found return
  const exist: QueryResult<Pick<Teacher, "profile">> = await connection.query<
    Pick<Teacher, "profile">
  >(`SELECT PROFILE FROM TEACHERS WHERE ID = $1`, [parsParams.data.id]);
  if (!exist.rowCount) {
    return res.status(409).json({ message: "studnet with this id not exist" });
  }
  const deleteFilePath = path.join(
    __dirname,
    "..",
    "uploads",
    exist.rows[0].profile
  );

  if (fs.existsSync(deleteFilePath)) {
    await fs.unlinkSync(deleteFilePath);
  }
  const response = await connection.query(
    `DELETE FROM TEACHERS WHERE ID = $1`,
    [parsParams.data.id]
  );
  console.log(response);
  return res.sendStatus(204);
};

const updateTeacher = async (req: Request, res: Response) => {
  try {
    //connect to db
    const connection = await pool.connect();
    const parseBody = updateSchemaValidation.safeParse(req.body);
    if (!parseBody.success) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "please pass valid body" });
    }
    const update = await connection.query(
      `UPDATE TEACHERS SET NAME=$1,EMAIL=$2 WHERE ID = $ID`,
      [parseBody.data.name, parseBody.data.email, parseBody.data.id.toString()]
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
export default {
  getTeacher,
  createTeacher,
  deleteTeacher,
  updateTeacher,
};
