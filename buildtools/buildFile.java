package buildtools;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.Vector;

import org.apache.tools.ant.Project;
import org.apache.tools.ant.Task;
import org.apache.tools.ant.types.FileList;

public class buildFile extends Task{

	private Vector filelists = new Vector();

	public void addFileList(FileList filelist) {
	    filelists.add(filelist);
	    System.out.println(filelists.size());
	}

	public void execute(){
        String[] includedFiles = null;
        String fileStr = "";
        Project proj = getProject();
        String name = "ecui";
	    for (Iterator iterator = filelists.iterator(); iterator.hasNext();) {
	    	FileList fl = (FileList) iterator.next();
	    	includedFiles = fl.getFiles(proj);
	    	for (int i = 0 ; i < includedFiles.length ; i ++) {
	    		fileStr += "document.write('<script1 src=\"" + includedFiles[i] + "></script>');\n";
	    	}
	    } 
	    //System.out.println(includedFiles);
	    File file = new File("public/src/"+ name + "/" + name + "-debug.js");
	    try {
			file.createNewFile();
			FileWriter fw = new FileWriter(file);
			PrintWriter pw = new PrintWriter(fw);
			pw.println(fileStr);
			pw.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}

