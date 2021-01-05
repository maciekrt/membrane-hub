# requires
# pip install nbparameterise
# pip install cellpose
import nbclient
import nbformat
from nbparameterise import (
    extract_parameters, replace_definitions, parameter_values
)

from pathlib import Path
from nbclient import execute
import datetime

def main(notebook_path, basedir_out, input_file_path):

    notebook_file_stem = Path(notebook_path).stem

    with open(notebook_path) as f:
        nb = nbformat.read(f, as_version=4)

    # Get a list of Parameter objects
    orig_parameters = extract_parameters(nb)

    print(orig_parameters)

    input_file_name = Path(input_file_path).stem

    # Update one or more parameters
    params = parameter_values(orig_parameters, basedir_out=basedir_out, czi_file_path=input_file_path)

    print(params)

    new_nb = replace_definitions(nb, params, execute=False)
    execute(new_nb)
    timestamp_filename_safe = datetime.datetime.now().strftime("%Y_%m_%d-%H_%M_%S")
    notebook_trace_file_path = f"{basedir_out}/{notebook_file_stem}_{input_file_name}_{timestamp_filename_safe}.ipynb"
    with open(notebook_trace_file_path, 'w') as f:
        nbformat.write(new_nb, f)
    print(f'Wrote notebook trace to {notebook_trace_file_path}')

    return notebook_trace_file_path
    

if __name__ == "__main__":
    notebook_path = '/home/ubuntu/Projects/dispatcherMembrane/segmentation/run_quick.ipynb'
    basedir_out='/home/ubuntu/tmp/'
    input_file_path = '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
    main(notebook_path=notebook_path, basedir_out=basedir_out, input_file_path=input_file_path)
